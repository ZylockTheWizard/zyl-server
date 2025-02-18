import { DefaultEventsMap, Server, Socket } from 'socket.io'
import { Logger } from './logger'

type S = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

export class ZylServer
{
    static databaseSocket: S

    static registerSocketEvents = (socket: S) => {
        const onDisconnect = () => {
            Logger.log('Client Disconnected: ' + socket.id)
        }
    
        const onQuery = (query: string, callback: (val: any) => void) => {
            Logger.log({socket: socket.id, query})
            if(!this.databaseSocket) {
                const message = 'Server Error: database is not connected'
                Logger.error(message)
                callback({error: message})
            } 
            else {
                this.databaseSocket?.emit('query', query, (val: any) => callback(val))
            }
        }

        socket.on('disconnect', onDisconnect)
        socket.on('query', onQuery)
    }

    static onConnection = (socket: S) => {
        Logger.log('Client Connected: ' + socket.id)
        if(socket.handshake.query.database) {
            const database = socket.handshake.query.database
            if(database !== 'CyberPow230915') {
                Logger.log('Database computer name is invalid: ' + database)
                socket.disconnect()
            }
            else {
                this.databaseSocket = socket
                Logger.log('Database Registered: ' + this.databaseSocket.id)
            }
        }
        this.registerSocketEvents(socket)
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