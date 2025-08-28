export const onlineUsers = new Set();
export {UserConnected, UserDisconnected, isUserConnected};

function UserConnected(userId) {
    onlineUsers.add(userId);
}

function UserDisconnected(userId) {
    onlineUsers.delete(userId);
}

function isUserConnected(userId) {
    if(onlineUsers.has(userId))
        return(1);
    return(0);
}