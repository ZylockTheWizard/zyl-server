export const userQuery = (id: string) => {
    return `
        SELECT * FROM users
        WHERE id = '${id}'
    `
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
