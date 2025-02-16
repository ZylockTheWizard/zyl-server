import { DefaultEventsMap, Server, Socket } from 'socket.io'
import { Logger } from './logger'

type S = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

class ZylSocket
{
    onDisconnect = () => {
        Logger.log('Client Disconnected: ' + this.socket.id)
    }

    onLogin = (args: any, callback: (val: string) => void) => {
        Logger.log({socket: this.socket.id, args})
        callback('got it')
    }

    constructor(private socket: S) 
    {
        socket.on('disconnect', this.onDisconnect)
        socket.on('login', this.onLogin)
    }
}

export class ZylServer
{
    static onConnection(socket: S)   
    {
        Logger.log('Client Connected: ' + socket.id)
        new ZylSocket(socket)
    }

    public static start()
    {
        const port = 3001
        const server = new Server({cors: {origin: '*'}})
        server.on('connection', this.onConnection)
        server.listen(port)
        Logger.log('Listening on port: ' + port)
    }
}