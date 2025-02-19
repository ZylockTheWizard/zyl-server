import mysql from 'mysql'
import { Logger } from './logger'

export class Database {
    static connection: mysql.Connection

    static connect() {
        const config: mysql.ConnectionConfig = {
            user: 'root',
            database: 'zyl',
            host: 'localhost',
            password: 'lolipop0-A',
        }
        this.connection = mysql.createConnection(config)
        this.connection.connect((err) => {
            if (err) throw err
        })
    }

    static query(q: string) {
        Logger.log({ query: q })
        const resolveQuery = (resolve: (value: any) => void) => {
            const onComplete: mysql.queryCallback = (err, result) => {
                if (err) throw err
                Logger.log({ result })
                resolve(result)
            }
            this.connection.query(q, onComplete)
        }
        return new Promise(resolveQuery)
    }
}
