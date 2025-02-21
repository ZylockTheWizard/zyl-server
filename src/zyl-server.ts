import readline from 'node:readline'
import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import { DefaultEventsMap, Server, Socket } from 'socket.io'
import { Logger } from './logger'
import { Database } from './database'

type S = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

export class ZylServer {
    static sockets: S[] = []

    static socketDisconnect = (socket: S) => {
        return () => {
            Logger.log('Client Disconnected: ' + socket.id)
        }
    }

    static socketQuery = (socket: S) => {
        return async (query: string, callback: (val: any) => void) => {
            Logger.log('Client Query: ' + socket.id)
            callback(await Database.query(query))
        }
    }

    static onConnection = (socket: S) => {
        Logger.log('Client Connected: ' + socket.id)
        socket.on('disconnect', this.socketDisconnect(socket))
        socket.on('query', this.socketQuery(socket))
        this.sockets.push(socket)
    }

    public static start() {
        const port = 3001

        Database.connect()

        const app = express()
        app.use(cors())
        const httpServer = createServer(app)
        const ioServer = new Server(httpServer)

        ioServer.on('connection', this.onConnection)
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
