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
