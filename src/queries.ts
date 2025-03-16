export const userQuery = (id?: string) => {
    let query = 'SELECT * FROM users'
    if (id) query += ` WHERE id = '${id}'`
    return query
}

export const passwordResetQuery = (id: string, password: string) => {
    return `
        UPDATE users
        SET
            password = '${password}',
            passwordReset = 0
        WHERE id = '${id}'
    `
}

export const messagesQuery = () => 'SELECT * FROM messages'

export const insertMessageQuery = (user: string, message: string) => {
    return `
        INSERT INTO messages (userId, message)
        VALUES ('${user}', '${message}')
    `
}

export const createUserQuery = (id: string) => {
    return `
        INSERT INTO users (id, password, passwordReset)
        VALUES ('${id}', UUID(), 1)
    `
}
