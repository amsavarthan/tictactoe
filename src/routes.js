import Home from "./components/Home";
import GameRoom from "./components/GameRoom";

//Routes of the application

export default [
  { path: "/", component: Home, exact: true },
  { path: "/room/:roomId", component: GameRoom },
];
