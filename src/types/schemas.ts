export const createUserSchema = {
    type: 'object',
    properties: {
        name : {
            type: 'string',
        },
    },
    required: ['name'],
    additionalProperties: false,
};

export const createBookSchema = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
        },
    },
    required: ['name'],
    additionalProperties: false,
};

export const returnBookSchema = {
    type: 'object',
    properties: {
        score: {
            type: 'number',
        },
    },
    required: ['score'],
    additionalProperties: false,
};