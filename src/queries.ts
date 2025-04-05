import { buildInsertQuery, buildSelectQuery, buildUpdateQuery, QueryObject } from './globals'

export const userQuery = (id?: string) => {
    const where: QueryObject = id ? { id, string: true } : undefined
    return buildSelectQuery('users', { where })
}

export const passwordResetQuery = (id: string, password: string) => {
    const updates: QueryObject[] = [{ password, string: true }, { passwordReset: 0 }]
    return buildUpdateQuery('users', updates, { id, string: true })
}

export const createUserQuery = (id: string) => {
    const values: QueryObject[] = [
        { id, string: true },
        { password: 'UUID()' },
        { passwordReset: 1 },
    ]
    return buildInsertQuery('users', values)
}

export const sceneQuery = (select?: string[], where?: { id?: string; name?: string }) => {
    let whereObject: QueryObject = undefined
    if (where) {
        const { id, name } = where
        if (id) whereObject = { id, string: true }
        else if (name) whereObject = { name, string: true }
    }
    return buildSelectQuery('scenes', { select, where: whereObject })
}

export const createSceneQuery = (name: string, data: string) => {
    const values: QueryObject[] = [
        { name, string: true },
        { data, string: true },
    ]
    return buildInsertQuery('scenes', values)
}

export const setCurrentSceneQuery = (sceneId: string, user: string) => {
    return buildUpdateQuery('users', [{ sceneId }], { id: user, string: true })
}

export const updateSceneDataQuery = (id: string, data: string) => {
    return buildUpdateQuery('scenes', [{ data, string: true }], { id, string: true })
}
