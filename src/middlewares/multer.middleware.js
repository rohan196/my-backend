import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {     // req coming from the user, multer-has the file access - used to handle file   
        cb(null, './public/temp')             // Callback - Error and destination
    },
    filename: function (req, file, cb) {
        cb(null, file.filename)             // or original name-  check which one - the name wiith which we store the file - it'll be there for a short time so we haven't triend that hard to add uniques id to it
    }
})

export const upload = multer({ 
    storage: storage
})