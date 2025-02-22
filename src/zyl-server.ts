import readline from 'node:readline'
import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import { DefaultEventsMap, Server, Socket } from 'socket.io'
import { Logger } from './logger'
import { Database } from './database'
import { passwordResetQuery, userQuery } from './queries'

type S = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

type ZylSocket = {
    socket: S
    user?: string
}

export class ZylServer {
    static ioServer: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
    static sockets: ZylSocket[] = []
    static zyleRoom = 'zyle-room'

    static socketDisconnect = (socket: S) => {
        return () => {
            Logger.log('Client Disconnected: ' + socket.id)
            socket.leave(this.zyleRoom)
            this.sockets = this.sockets.filter((s) => s.socket.id === socket.id)
            this.broadcastCurrentUsers()
        }
    }

    static socketQuery = (socket: S) => {
        return async (query: string, callback: (val: any) => void) => {
            Logger.log('Client Query: ' + socket.id)
            callback(await Database.query(query))
        }
    }

    static currentUsers = () => {
        return { users: this.sockets.filter((s) => s.user).map((s) => s.user) }
    }

    static broadcastCurrentUsers = () => {
        this.ioServer.to(this.zyleRoom).emit('connected-users', this.currentUsers())
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
                    const existingUser = this.sockets.find((s) => s.user?.toLowerCase() === user.toLowerCase())
                    console.log(existingUser?.socket.id)
                    if (existingUser && existingUser.socket.id !== socket.id) error = 'User already logged in'
                    else if (dbUser[0].passwordReset === 1) result = { passwordReset: true }
                    else {
                        const userSocket = this.sockets.find((s) => s.socket.id === socket.id)
                        userSocket.user = user
                        this.broadcastCurrentUsers()
                        userSocket.socket.join(this.zyleRoom)
                        result = this.currentUsers()
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

    static onConnection = (socket: S) => {
        Logger.log('Client Connected: ' + socket.id)
        socket.on('disconnect', this.socketDisconnect(socket))
        socket.on('query', this.socketQuery(socket))
        socket.on('login', this.socketLogin(socket))
        socket.on('password-reset', this.socketPasswordReset(socket))
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
