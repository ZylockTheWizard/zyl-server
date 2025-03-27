const str = (val: string) => `'${val}'`

type KeyString = {
    [key: string]: string
}
const keyStr = (obj: KeyString) => {
    const key = Object.keys(obj)[0]
    const val = Object.values(obj)[0]
    return `${key} = ${str(val)}`
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

export const sceneQuery = (props?: { id?: string; name?: string }) => {
    let query = 'SELECT id, name FROM scenes'
    if (props) {
        const { id, name } = props
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
