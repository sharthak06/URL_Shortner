export class AppError extends Error {
    isOperational: boolean;
    statusCode: number;
    status: string;
    errorCode?: string;

    constructor(message: string, statusCode: number, errorCode?: string) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }

}
