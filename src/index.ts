import { Server } from "socket.io";

const server = new Server({});

server.on("connection", socket => {
    console.log('a user connected')
    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
    socket.on('login', (args, callback) => {
        console.log({args})
        callback("got it")
    })
})

server.listen(3001)
console.log('Listening....')