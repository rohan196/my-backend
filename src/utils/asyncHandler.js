// Handling async function at one place to use again and again 
// To also generalize the error generation

// Promises way
// const asyncHandler = (requestHandler) => {
//     return (req, res, next) => {
//     Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
//     }
// }

// export {asyncHandler}

const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await Promise.resolve(requestHandler(req, res, next));
        } catch (error) {
            const statusCode = error.statusCode || 500;
            const errorMessage = error.message || "Internal Server Error";
            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    };
};

export {asyncHandler};












// Try-catch way

// How we got the syntax
// const asyncHandler = () => {}
// const asyncHandler = (func) => {() => {}}
// const asyncHandler = (func) => () => {} // we can omit the brackets
// const asyncHandler = () => async () => {}

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }