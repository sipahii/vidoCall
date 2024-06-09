// UserList.js
import React from "react";

const UserList = ({ users, currentUserId, onCallUser }) => {
  return (
    <div>
      <h2>Online Users</h2>
      <ul>
        {users
          .filter((user) => user.id !== currentUserId) // Exclude the current user
          .map((user) => (
            <li key={user.id}>
              {user.username}{" "}
              <button onClick={() => onCallUser(user.id)}>Call</button>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default UserList;
