import { DefaultEventsMap, Server, Socket } from 'socket.io'

export type SocketDefault = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
export type ServerDefault = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

export const areEqual = (a: string | undefined, b: string | undefined) =>
    a?.toLowerCase() === b?.toLowerCase()

export type KeyString = { [key: string]: string }
export type KeyRaw = { [key: string]: string | number }

const keyVal = (obj: object) => ({ key: Object.keys(obj)[0], val: Object.values(obj)[0] })

export const str = (val: string) => `'${val}'`
export const keyStr = (obj: KeyString) => {
    const { key, val } = keyVal(obj)
    return `${key} = ${str(val)}`
}
export const keyStrObj = (obj: KeyString) => {
    const { key, val } = keyVal(obj)
    return { key, val: str(val) }
}

export const raw = (val: string | number) => val.toString()
export const keyRaw = (obj: KeyRaw) => {
    const { key, val } = keyVal(obj)
    return `${key} = ${raw(val)}`
}
export const keyRawObj = (obj: KeyRaw) => {
    const { key, val } = keyVal(obj)
    return { key, val: raw(val) }
}

export const selectClause = (select: string[]) => {
    return 'SELECT ' + (select?.length > 0 ? select.join() : '*')
}

export const fromClause = (table: string) => `FROM ${table}`

export const whereClause = (where: string) => {
    return where ? 'WHERE ' + where : undefined
}

export const buildSelectQuery = (table: string, props?: { select?: string[]; where?: string }) => {
    const clauses = [selectClause(props?.select), fromClause(table), whereClause(props?.where)]
    return clauses.join(' ')
}

export const buildUpdateQuery = (table: string, updates: string[], where: string) => {
    return `UPDATE ${table} SET ${updates.join()} WHERE ${where}`
}

export const buildInsertQuery = (table: string, values: { key: string; val: any }[]) => {
    return `INSERT INTO ${table} (${values.map((v) => v.key).join()}) VALUES (${values.map((v) => v.val).join()})`
}
