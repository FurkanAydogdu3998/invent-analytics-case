export interface ICreateUser {
    name: string,
    email: string,
}

export interface ICreateBook {
    name: string,
}

export interface IReturnBook {
    score: number,
}

export interface IError {
    status: number,
    return: object,
}