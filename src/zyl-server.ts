import readline from 'node:readline'
import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { Logger } from './logger'
import { Database } from './database'
import {
    createSceneQuery,
    createUserQuery,
    passwordResetQuery,
    sceneQuery,
    setCurrentSceneQuery,
    userQuery,
} from './queries'
import { areEqual, ServerDefault, SocketDefault } from './globals'

type ZylSocket = {
    user?: string
    socket: SocketDefault
}

export class ZylServer {
    static zyleRoom = 'zyl-room'
    static ioServer: ServerDefault
    static sockets: ZylSocket[] = []

    static socketDisconnect = (socket: SocketDefault) => {
        return () => {
            Logger.log('Client Disconnected: ' + socket.id)
            socket.leave(this.zyleRoom)
            this.sockets = this.sockets.filter((s) => s.socket.id !== socket.id)
            this.broadcastCurrentUsers()
        }
    }

    static socketQuery = (socket: SocketDefault) => {
        return async (query: string, callback: (val: any) => void) => {
            Logger.log('Client Query: ' + socket.id)
            callback(await Database.query(query))
        }
    }

    static existingUser = (user: string) => {
        return this.sockets.find((s) => areEqual(s.user, user))
    }

    static currentUsers = async () => {
        const allUsers = await Database.query(userQuery())
        const users = allUsers.map((u: any) => {
            const { password, ...rest } = u
            const existingUser = this.existingUser(u.id)
            return { ...rest, connected: !!existingUser }
        })
        users.sort((a: any, b: any) => a.id.localeCompare(b.id))
        users.sort((a: any, b: any) => (a.connected === b.connected ? 0 : a.connected ? -1 : 1))
        return { users }
    }

    static broadcastCurrentUsers = async () => {
        this.ioServer.to(this.zyleRoom).emit('current-users', await this.currentUsers())
    }

    static currentScenes = async () => {
        return { scenes: await Database.query(sceneQuery(['id', 'name'])) }
    }

    static socketLogin = (socket: SocketDefault) => {
        return async (user: string, password: string, callback: (val: any) => void) => {
            let result: any
            let error = ''
            if (!user || !password) error = 'Inputs are empty'
            else {
                const dbUser = await Database.query(userQuery(user))
                if (!dbUser) error = 'Database error'
                else if (dbUser.length === 0) error = 'User not found'
                else if (dbUser[0].password !== password) error = 'Incorrect password'
                else {
                    const existingUser = this.existingUser(user)
                    if (existingUser && existingUser.socket.id !== socket.id)
                        error = 'User already logged in'
                    else if (dbUser[0].passwordReset === 1) result = { passwordReset: true }
                    else {
                        const userSocket = this.sockets.find((s) => s.socket.id === socket.id)
                        userSocket.user = user
                        await this.broadcastCurrentUsers()
                        userSocket.socket.join(this.zyleRoom)
                        const scenes = dbUser[0].master === 1 ? await this.currentScenes() : {}
                        const currentScene = await Database.query(
                            sceneQuery(['data'], dbUser[0].sceneId),
                        )
                        const currentSceneData =
                            currentScene?.length > 0 ? currentScene[0].data : undefined
                        result = {
                            ...(await this.currentUsers()),
                            ...scenes,
                            currentSceneData,
                        }
                    }
                }
            }
            callback({ error, result })
        }
    }

    static socketPasswordReset = (_socket: SocketDefault) => {
        return async (user: string, password: string, callback: (val: any) => void) => {
            let error = ''
            if (!user || !password) error = 'Inputs are empty'
            else await Database.query(passwordResetQuery(user, password))
            callback({ error })
        }
    }

    static getUser = (id: string) => {
        return this.sockets.find((s) => s.socket.id === id).user
    }

    static socketUserSave = (_socket: SocketDefault) => {
        return async (id: string, callback: (val: any) => void) => {
            let error = ''
            if (!id) error = 'Input is empty'
            else {
                const existingUser = await Database.query(userQuery(id))
                if (existingUser?.length > 0) error = 'User ID already exists'
                else {
                    await Database.query(createUserQuery(id))
                    await this.broadcastCurrentUsers()
                }
            }
            callback({ error })
        }
    }

    static socketSceneSave = (_socket: SocketDefault) => {
        return async (name: string, data: string, callback: (val: any) => void) => {
            let error = ''
            let result = {}
            if (!name || !data) error = 'Input is empty'
            else {
                const existingScene = await Database.query(sceneQuery(['id'], { name }))
                if (existingScene?.length > 0) error = 'Scene name already exists'
                else {
                    await Database.query(createSceneQuery(name, data))
                    result = await this.currentScenes()
                }
            }
            callback({ result, error })
        }
    }

    static socketSetCurrentScene = (socket: SocketDefault) => {
        return async (sceneId: string, user: string) => {
            await Database.query(setCurrentSceneQuery(sceneId, user))
            const result = await Database.query(sceneQuery(['data'], { id: sceneId }))
            socket.emit('scene-data', result[0].data)
        }
    }

    static onConnection = (socket: SocketDefault) => {
        Logger.log('Client Connected: ' + socket.id)
        socket.on('disconnect', this.socketDisconnect(socket))
        socket.on('query', this.socketQuery(socket))
        socket.on('login', this.socketLogin(socket))
        socket.on('password-reset', this.socketPasswordReset(socket))
        socket.on('logout', () => socket.disconnect())
        socket.on('user-save', this.socketUserSave(socket))
        socket.on('scene-save', this.socketSceneSave(socket))
        socket.on('set-current-scene', this.socketSetCurrentScene(socket))
        this.sockets.push({ socket })
    }

    public static start() {
        const port = 3001

        Database.connect()

        const app = express()
        app.use(cors())
        const httpServer = createServer(app)
        this.ioServer = new Server(httpServer)

        this.ioServer.on('connection', this.onConnection)
        app.use('/images', express.static('images'))
        app.get('/', (_req, res) => {
            res.send('<h1>Hello from the server!</h1>')
        })

        const consoleInterface = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })

        httpServer.listen(port, () => {
            consoleInterface.question(`Running server on port ${port}...\n`, () => process.exit())
        })
    }
}
