import { buildInsertQuery, buildSelectQuery, buildUpdateQuery, QueryObject } from './globals'

export const userQuery = (id?: string) => {
    const where: QueryObject = id ? { id } : undefined
    return buildSelectQuery('users', { where })
}

export const passwordResetQuery = (id: string, password: string) => {
    const updates: QueryObject[] = [{ password }, { passwordReset: 0 }]
    return buildUpdateQuery('users', updates, { id })
}

export const createUserQuery = (id: string) => {
    const values: QueryObject[] = [{ id }, { password: { val: 'UUID()' } }, { passwordReset: 1 }]
    return buildInsertQuery('users', values)
}

export const sceneQuery = (select?: string[], where?: { id?: string; name?: string }) => {
    let whereObject: QueryObject = undefined
    if (where) {
        const { id, name } = where
        if (id) whereObject = { id }
        else if (name) whereObject = { name }
    }
    return buildSelectQuery('scenes', { select, where: whereObject })
}

export const createSceneQuery = (name: string, data: string) => {
    const values: QueryObject[] = [{ name }, { data }]
    return buildInsertQuery('scenes', values)
}

export const setCurrentSceneQuery = (sceneId: string, user: string) => {
    return buildUpdateQuery('users', [{ sceneId }], { id: user })
}

export const updateSceneDataQuery = (id: string, data: string) => {
    return buildUpdateQuery('scenes', [{ data }], { id })
}

export const tokenQuery = (id?: string) => {
    const where: QueryObject = id ? { id } : undefined
    return buildSelectQuery('characters', { where })
}
