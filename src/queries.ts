import {
    buildInsertQuery,
    buildSelectQuery,
    buildUpdateQuery,
    keyRaw,
    keyRawObj,
    keyStr,
    keyStrObj,
} from './globals'

export const userQuery = (id?: string) => {
    const where = id ? keyStr({ id }) : undefined
    return buildSelectQuery('users', { where })
}

export const passwordResetQuery = (id: string, password: string) => {
    const updates = [keyStr({ password }), keyRaw({ passwordReset: 0 })]
    return buildUpdateQuery('users', updates, keyStr({ id }))
}

export const createUserQuery = (id: string) => {
    const values = [
        keyStrObj({ id }),
        keyRawObj({ password: 'UUID()' }),
        keyRawObj({ passwordReset: 1 }),
    ]
    return buildInsertQuery('users', values)
}

export const sceneQuery = (select?: string[], where?: { id?: string; name?: string }) => {
    let whereString = undefined
    if (where) {
        const { id, name } = where
        if (id) whereString = keyStr({ id })
        else if (name) whereString = keyStr({ name })
    }
    return buildSelectQuery('scenes', { select, where: whereString })
}

export const createSceneQuery = (name: string, data: string) => {
    const values = [keyStrObj({ name }), keyStrObj({ data })]
    return buildInsertQuery('scenes', values)
}

export const setCurrentSceneQuery = (sceneId: string, user: string) => {
    return buildUpdateQuery('users', [keyRaw({ sceneId })], keyStr({ id: user }))
}

export const updateSceneDataQuery = (id: string, data: string) => {
    return buildUpdateQuery('scenes', [keyStr({ data })], keyStr({ id }))
}
