import fs from 'node:fs'

export class Logger
{
    static logFolder = 'logs'
    static logFile = this.logFolder + '/out.log'
    static errorFile = this.logFolder + + '/error.log'

    static 
    {
        if (!fs.existsSync(this.logFolder)) {
            fs.mkdirSync(this.logFolder)
        }
        process.on('uncaughtExceptionMonitor', err => {
            this.error(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    private static standardize(message: string | object)
    {
        const output = typeof message === 'object' ? JSON.stringify(message) : message
        return new Date().toISOString() + ' - ' + output
    }

    private static writeLine(file: string, line: string)
    {
        fs.appendFileSync(file, line + '\r\n')
    }

    public static log(message: string | object)
    {
        const output = this.standardize(message)
        console.log(output)
        this.writeLine(this.logFile, output)
    }

    public static error(message: string | object)
    {
        const output = this.standardize(message)
        console.error(output)
        this.writeLine(this.logFile, output)
        this.writeLine(this.errorFile, output)
    }
}