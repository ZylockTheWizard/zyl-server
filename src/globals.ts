import { DefaultEventsMap, Server, Socket } from 'socket.io'

export type SocketDefault = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
export type ServerDefault = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

export const areEqual = (a: string | undefined, b: string | undefined) =>
    a?.toLowerCase() === b?.toLowerCase()

export type QueryObject = {
    [key: string]: string | number | boolean
    string?: boolean
}

const keyVal = (obj: QueryObject) => ({ key: Object.keys(obj)[0], val: Object.values(obj)[0] })
const raw = (val: string | number | boolean) => (!val ? 'NULL' : val.toString())
const str = (val: string | number | boolean) => (!val ? 'NULL' : `'${val}'`)

const dbObject = (obj: QueryObject) => {
    const { key, val } = keyVal(obj)
    return { key, val: obj.string ? str(val) : raw(val) }
}

const equalString = (obj: QueryObject) => {
    const { key, val } = dbObject(obj)
    return `${key} = ${val}`
}

const selectClause = (select: string[]) => {
    return 'SELECT ' + (select?.length > 0 ? select.join() : '*')
}

const fromClause = (table: string) => `FROM ${table}`

const whereClause = (where: QueryObject) => {
    return where ? 'WHERE ' + equalString(where) : undefined
}

export const buildSelectQuery = (
    table: string,
    props?: { select?: string[]; where?: QueryObject },
) => {
    return [selectClause(props?.select), fromClause(table), whereClause(props?.where)].join(' ')
}

export const buildUpdateQuery = (table: string, updates: QueryObject[], where: QueryObject) => {
    const updateString = updates.map((u) => equalString(u)).join()
    return `UPDATE ${table} SET ${updateString} ${whereClause(where)}`
}

export const buildInsertQuery = (table: string, values: QueryObject[]) => {
    const dbObjects = values.map((v) => dbObject(v))
    return `INSERT INTO ${table} (${dbObjects.map((v) => v.key).join()}) VALUES (${dbObjects.map((v) => v.val).join()})`
}
