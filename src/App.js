import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Fade from "@material-ui/core/Fade";

import io from "socket.io-client";
import { Twemoji } from "react-emoji-render";
import { reactLocalStorage as Storage } from "reactjs-localstorage";

import AppContext from "./context/AppContext";
import NotFound from "./components/NotFound";
import routes from "./routes";

import { Client as Styletron } from "styletron-engine-atomic";
import { Provider as StyletronProvider } from "styletron-react";
import { LightTheme, BaseProvider, DarkTheme } from "baseui";
import { Toast, KIND } from "baseui/toast";
import { StyledSpinnerNext } from "baseui/spinner";
import DayNightSwitch from "./components/DayNightSwitch";

//For development localhost:9900
const socket = io(process.env.SERVER, {
  secure: true,
});

const engine = new Styletron();

const App = () => {
  //APP STATES

  //For Toast
  const [message, setMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [severity, setSeverity] = useState("warning");

  //For Loading screen
  const [isLoading, setLoading] = useState(false);

  //For Error Screen
  const [isError, setError] = useState(undefined);
  const [errorBody, setErrorBody] = useState("");

  //For redirect
  const [validRedirect, setValidRedirect] = useState(false);

  //Fro player informations
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [playerOneName, setPlayerOneName] = useState(null);
  const [playerTwoName, setPlayerTwoName] = useState(null);

  //For game status
  const [canPlay, setCanPlay] = useState(false);
  const [completedCells, setCompletedCells] = useState([]);
  const [winCells, setWinCells] = useState([]);
  const [won, setWon] = useState(false);

  //For theme switching
  const [isDark, setIsDark] = useState();
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    //in local storage only string gets stored
    const asBool = Storage.get("darkTheme", false) === "true" ? true : false;
    setIsDark(asBool);

    socket.on("connect", () => {
      if (Storage.get("id") === undefined) Storage.set("id", socket.id);
    });

    //Function to handle any message from server
    //This shows a alert at bottom of page
    socket.on("alert", ({ message, severity }) => {
      toggleAlert(message, severity);
    });

    //triggred when a user joins a room
    socket.on("game-status-update", (document) => {
      setCompletedCells(document.playedCells);
      setCurrentPlayer(
        document.player1.id === socket.id
          ? "player1"
          : document.player2.id === socket.id
          ? "player2"
          : null
      );
      if (document.player1.online && document.player2.online) {
        if (completedCells.length === 0) {
          setCanPlay(document.player1.id === socket.id);
        }
      } else {
        setCanPlay(false);
      }
    });

    //exectued after room created, joined room, and also for each game move (turns)
    socket.on("room-update", (document) => {
      setCurrentPlayer(
        document.player1.id === socket.id
          ? "player1"
          : document.player2.id === socket.id
          ? "player2"
          : null
      );

      setPlayerOneName(document.player1.name);
      setPlayerTwoName(document.player2.name);
    });
  }, []);

  //FUNCTION TO SHOW ALERT EVEN FROM OTHER COMPONENTS

  const toggleAlert = (message, severity) => {
    setMessage(message);
    setShowAlert(true);
    switch (severity) {
      case "info":
        setSeverity(KIND.info);
        break;
      case "danger":
        setSeverity(KIND.negative);
        break;
      case "success":
        setSeverity(KIND.positive);
        break;
      case "warning":
        setSeverity(KIND.warning);
        break;
      default:
        setSeverity(KIND.info);
        break;
    }
    setTimeout(() => setShowAlert(false), 2000);
  };

  //CONTEXT PROPS

  const appProps = {
    socket,
  };

  const roomdataProps = {
    currentPlayer,
    playerOneName,
    playerTwoName,
    canPlay,
    setCanPlay,
    completedCells,
    setCompletedCells,
    winCells,
    setWinCells,
    won,
    setWon,
  };

  const pageStateProps = {
    isLoading,
    setLoading,
    isError,
    errorBody,
    setError,
    setErrorBody,
    validRedirect,
    setValidRedirect,
  };

  const toastProps = {
    toggleAlert,
  };

  const themeProps = {
    isDark,
    setIsDark,
    animating,
    setAnimating,
  };

  //COMPONENTS

  const spinner = (
    <Fade in={isLoading}>
      <div
        style={{ backgroundColor: isDark ? "black" : "white" }}
        className="center-absolute"
      >
        <div className="center">
          <StyledSpinnerNext />
        </div>
      </div>
    </Fade>
  );

  const alert = (
    <Fade in={showAlert}>
      <div
        className="center trim"
        style={{ position: "fixed", bottom: "10px", width: "100vw" }}
      >
        <Toast kind={severity}>
          <Twemoji text={message} />
        </Toast>
      </div>
    </Fade>
  );

  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={isDark ? DarkTheme : LightTheme}>
        <AppContext.Provider
          value={{
            appProps,
            roomdataProps,
            pageStateProps,
            toastProps,
            themeProps,
          }}
        >
          <BrowserRouter>
            <Switch>
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  component={route.component}
                  exact={route.exact}
                />
              ))}
              <Route component={NotFound} />
            </Switch>
          </BrowserRouter>
          {showAlert && alert}
          {isLoading && spinner}
          <DayNightSwitch />
        </AppContext.Provider>
      </BaseProvider>
    </StyletronProvider>
  );
};

export default App;
