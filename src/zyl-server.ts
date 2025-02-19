import readline from 'node:readline'
import { createServer } from 'node:http'
import express, { Express } from 'express'
import cors from 'cors'
import { DefaultEventsMap, Server, Socket } from 'socket.io'
import { Logger } from './logger'
import { Database } from './database'

type S = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

class ZylSocket
{
    onDisconnect = () => {
        Logger.log('Client Disconnected: ' + this.socket.id)
    }

    onQuery = async(query: string, callback: (val: any) => void) => {
        callback(await Database.query(query))
    }

    constructor(private socket: S)
    {
        this.socket.on('disconnect', this.onDisconnect)
        this.socket.on('query', this.onQuery)
    }
}

export class ZylServer
{
    private static app: Express

    private static rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    static onConnection = (socket: S) => {
        Logger.log('Client Connected: ' + socket.id)
        new ZylSocket(socket)
    }

    public static start()
    {
        const port = 3001

        Database.connect()
        
        this.app = express()
        this.app.use(cors())
        const httpServer = createServer(this.app)
        const ioServer = new Server(httpServer)

        ioServer.on('connection', this.onConnection)
        this.app.use('/images', express.static('images'))
        this.app.get('/', (_req, res) => {
            res.send('<h1>Hello from the server!</h1>')
        })
        httpServer.listen(port, () => {
            this.rl.question(`Running server on PORT ${port}...\n`, () => process.exit())
        })
    }
}