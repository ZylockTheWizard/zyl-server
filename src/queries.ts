const str = (val: string) => `'${val}'`
type KeyString = { [key: string]: string }
const keyStr = (obj: KeyString) => {
    const key = Object.keys(obj)[0]
    const val = Object.values(obj)[0]
    return `${key} = ${str(val)}`
}

const int = (val: string | number) => val.toString()
type KeyInt = { [key: string]: string | number }
const keyInt = (obj: KeyInt) => {
    const key = Object.keys(obj)[0]
    const val = Object.values(obj)[0]
    return `${key} = ${int(val)}`
}

export const userQuery = (id?: string) => {
    let query = 'SELECT * FROM users'
    if (id) query += ` WHERE ${keyStr({ id })}`
    return query
}

export const passwordResetQuery = (id: string, password: string) => {
    return `
        UPDATE users
        SET
            ${keyStr({ password })},
            passwordReset = 0
        WHERE ${keyStr({ id })}
    `
}

export const createUserQuery = (id: string) => {
    return `
        INSERT INTO users (id, password, passwordReset)
        VALUES (${str(id)}, UUID(), 1)
    `
}

export const sceneQuery = (select?: string[], where?: { id?: string; name?: string }) => {
    const selectClause = 'SELECT ' + (select?.length > 0 ? select.join() : '*')
    let query = selectClause + ' FROM scenes'
    if (where) {
        const { id, name } = where
        if (id || name) {
            query += ' WHERE '
            const idClause = id ? keyStr({ id }) : undefined
            const nameClause = name ? keyStr({ name }) : undefined
            const whereClause = [idClause, nameClause].filter((c) => c).join(' AND ')
            query += whereClause
        }
    }
    return query
}

export const createSceneQuery = (name: string, data: string) => {
    return `
        INSERT INTO scenes (name, data)
        VALUES (${str(name)}, ${str(data)})
    `
}

export const setCurrentSceneQuery = (sceneId: string, user: string) => {
    return `
        UPDATE users
        SET ${keyInt({ sceneId })}
        WHERE ${keyStr({ id: user })}
    `
}
