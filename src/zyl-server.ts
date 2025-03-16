import readline from 'node:readline'
import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import { DefaultEventsMap, Server, Socket } from 'socket.io'
import { Logger } from './logger'
import { Database } from './database'
import {
    createUserQuery,
    insertMessageQuery,
    messagesQuery,
    passwordResetQuery,
    userQuery,
} from './queries'

type S = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

type ZylSocket = {
    socket: S
    user?: string
}

export class ZylServer {
    static ioServer: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
    static sockets: ZylSocket[] = []
    static zyleRoom = 'zyl-room'

    static socketDisconnect = (socket: S) => {
        return () => {
            Logger.log('Client Disconnected: ' + socket.id)
            socket.leave(this.zyleRoom)
            this.sockets = this.sockets.filter((s) => s.socket.id !== socket.id)
            this.broadcastCurrentUsers()
        }
    }

    static socketQuery = (socket: S) => {
        return async (query: string, callback: (val: any) => void) => {
            Logger.log('Client Query: ' + socket.id)
            callback(await Database.query(query))
        }
    }

    static existingUser = (user: string) => {
        return this.sockets.find((s) => s.user?.toLowerCase() === user.toLowerCase())
    }

    static currentUsers = async () => {
        const allUsers = await Database.query(userQuery())
        const users = allUsers.map((u: any) => {
            const existingUser = this.existingUser(u.id)
            return { ...u, connected: !!existingUser }
        })
        users.sort((a: any, b: any) => a.id.localeCompare(b.id))
        users.sort((a: any, b: any) => (a.connected === b.connected ? 0 : a.connected ? -1 : 1))
        return { users }
    }

    static broadcastCurrentUsers = async () => {
        this.ioServer.to(this.zyleRoom).emit('current-users', await this.currentUsers())
    }

    static currentMessages = async () => {
        return { messages: await Database.query(messagesQuery()) }
    }

    static socketLogin = (socket: S) => {
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
                        result = {
                            ...(await this.currentUsers()),
                            ...(await this.currentMessages()),
                        }
                    }
                }
            }
            callback({ error, result })
        }
    }

    static socketPasswordReset = (_socket: S) => {
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

    static broadcastMessages = async () => {
        this.ioServer.to(this.zyleRoom).emit('current-messages', await this.currentMessages())
    }

    static socketMessage = (socket: S) => {
        return async (message: string) => {
            const user = this.getUser(socket.id)
            await Database.query(insertMessageQuery(user, message))
            await this.broadcastMessages()
        }
    }

    static socketUserSave = (_socket: S) => {
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

    static onConnection = (socket: S) => {
        Logger.log('Client Connected: ' + socket.id)
        socket.on('disconnect', this.socketDisconnect(socket))
        socket.on('query', this.socketQuery(socket))
        socket.on('login', this.socketLogin(socket))
        socket.on('password-reset', this.socketPasswordReset(socket))
        socket.on('logout', () => socket.disconnect())
        socket.on('message', this.socketMessage(socket))
        socket.on('user-save', this.socketUserSave(socket))
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
