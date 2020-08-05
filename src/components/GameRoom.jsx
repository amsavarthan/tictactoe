import React, { useEffect, useContext, useState } from "react";

import { Fade, Grow, Zoom, Collapse } from "@material-ui/core";

import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Tag, KIND as TagKIND, VARIANT } from "baseui/tag";
import { Notification, KIND as NotiKIND } from "baseui/notification";

import { useHistory } from "react-router-dom";

import { ReactSVG } from "react-svg";
import { reactLocalStorage as Storage } from "reactjs-localstorage";

import AppContext from "../context/AppContext";

//Place to place tictactoe

const ModernGameRoom = ({ match }) => {
  const {
    params: { roomId },
  } = match;
  const {
    appProps: { socket },
    pageStateProps: {
      setLoading,
      isLoading,
      isError,
      errorBody,
      setError,
      setErrorBody,
      validRedirect,
      setValidRedirect,
    },
    toastProps: { toggleAlert },
    roomdataProps: {
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
    },
  } = useContext(AppContext);

  const [winner, setWinner] = useState(undefined);

  const history = useHistory();
  const [css, theme] = useStyletron();

  //To load the game
  //equals to componentDidMount
  useEffect(() => {
    document.title = "tictactoe | Room";
    const name = Storage.get("name");
    const roomIdfromStorage = Storage.get("roomId");

    //validRedirect will be true only if the user is from home page to game room
    if (!validRedirect) {
      //some times when user in a room refreshed the page we check for previous session from local storage
      if (roomId !== undefined && name !== undefined) {
        if (roomIdfromStorage === roomId) {
          const oldSocketId = Storage.get("id");
          setLoading(true);
          socket.emit("join-room", {
            name,
            roomId,
            oldSocketId,
          });
        } else {
          setErrorBody("You need to join this room from the home page.");
          setError(true);
        }
      } else {
        setErrorBody("You need to join this room from the home page.");
        setError(true);
      }
    } else {
      setValidRedirect(false);
      setError(false);
    }

    //if only one user was online before pressing refresh
    //we create a new room because once we lost a socket, we delete the room
    //this happens at backend 'socketHandler.removeOrUpdateClientStatus'
    socket.on("created-room", ({ roomId }) => {
      reconnect(roomId);
    });

    //if both users were online before pressing refresh
    //we join the rejoining user to this room
    socket.on("joined-room", ({ roomId }) => reconnect(roomId));

    //When ever the other player click on a cell
    //this is catched
    socket.on("on-user-selected", ({ completedCells, playedBy }) => {
      setCanPlay(playedBy !== socket.id);
      setCompletedCells(completedCells);
    });

    //to restart the game
    socket.on("restart-game", () => {
      //Since only player1 can restart the game we know that currentPlayer who listens to this is player2 so
      //we disable his gameplay
      setCanPlay(false);
      setWinner(undefined);
      setWon(false);
      setWinCells([]);
      setCompletedCells([]);
    });
  }, []);

  //when ever completedCells state is changed this is triggred
  //equals to componentDidUpdate
  useEffect(() => {
    checkForWin();
  }, [completedCells]);

  //LOGIC FOR WIN

  const winningConditions = [
    ["cell00", "cell01", "cell02"],
    ["cell10", "cell11", "cell12"],
    ["cell20", "cell21", "cell22"],
    ["cell00", "cell10", "cell20"],
    ["cell01", "cell11", "cell21"],
    ["cell02", "cell12", "cell22"],
    ["cell00", "cell11", "cell22"],
    ["cell02", "cell11", "cell20"],
  ];

  const checkForWin = () => {
    for (let i = 0; i < winningConditions.length; i++) {
      const condition = winningConditions[i];
      const a = completedCells.find((cell) => cell.clickedAt === condition[0]);
      const b = completedCells.find((cell) => cell.clickedAt === condition[1]);
      const c = completedCells.find((cell) => cell.clickedAt === condition[2]);

      if (a === undefined || b === undefined || c === undefined) continue;
      if (a.clickedBy === b.clickedBy && b.clickedBy === c.clickedBy) {
        setWinner(a.clickedBy);
        setWinCells([a.clickedAt, b.clickedAt, c.clickedAt]);
        setWon(true);
        setCanPlay(false);
        return;
      }
    }

    if (!won && completedCells.length === 9) {
      setWinCells([
        "cell00",
        "cell01",
        "cell02",
        "cell10",
        "cell11",
        "cell12",
        "cell20",
        "cell21",
        "cell22",
      ]);
      setWinner("draw");
      setWon(true);
      setCanPlay(false);
      return;
    }
  };

  //UTILITY FUNCTIONS

  //These functions are triggered when reconnecting because this component is
  //only rerendered at that time not the functions at Home.jsx bcs
  //that component is not rendered.

  const reconnect = (roomId) => {
    Storage.set("id", socket.id);
    Storage.set("roomId", roomId);
    setValidRedirect(true);
    toggleAlert("Rejoined the room", "info");
    setLoading(false);
    setError(false);
  };

  //When a player click on a cell this is triggered
  const sendSelectionToServer = (e) => {
    //remove focus from the clicked button
    e.target.blur();
    const clickedAt = e.target.id;
    setCanPlay(false);
    setCompletedCells([
      ...completedCells,
      { clickedAt, clickedBy: currentPlayer },
    ]);
    socket.emit("on-user-selection", {
      roomId,
      playedBy: socket.id,
      completedCells: [
        ...completedCells,
        { clickedAt, clickedBy: currentPlayer },
      ],
    });
  };

  //To restart the game (only player1 can do it)
  const restartGame = () => {
    setCanPlay(true);
    setWinner(undefined);
    setWon(false);
    setWinCells([]);
    setCompletedCells([]);
    socket.emit("game-restart", roomId);
  };

  //COMPONENTS

  const errorComponent = (
    <div className="center-flex">
      <ReactSVG
        style={{
          height: "260px",
          width: "260px",
        }}
        src={require("../images/room_error.svg")}
      />
      <h1
        style={{
          fontWeight: "400",
          fontSize: "42px",
        }}
      >
        Something's wrong!
      </h1>
      <p style={{ fontWeight: "300" }}>{errorBody}</p>
      <Button
        kind={KIND.primary}
        size={SIZE.compact}
        onClick={() => {
          history.replace("/");
        }}
      >
        Go to Home
      </Button>
      <a
        style={{
          position: "absolute",
          bottom: "10px",
        }}
        href="https://stories.freepik.com/people"
      >
        Illustration by Stories by Freepik
      </a>
    </div>
  );

  const getIcon = (cell) => {
    return cell === undefined
      ? null
      : cell.clickedBy === "player1"
      ? "close"
      : "panorama_fish_eye";
  };

  const getButton = (id) => {
    const cell = completedCells.find((cell) => cell.clickedAt === id);
    return (
      <Button
        id={id}
        className="cell"
        onClick={
          canPlay && !won && cell === undefined ? sendSelectionToServer : null
        }
        style={{
          cursor:
            canPlay && !won && cell === undefined ? "pointer" : "not-allowed",
        }}
        kind={KIND.secondary}
        disabled={canPlay && !won && cell === undefined ? false : true}
        overrides={{
          BaseButton: {
            style: () => {
              return {
                outline: `${
                  winCells.includes(id)
                    ? theme.colors.accent
                    : theme.colors.buttonSecondaryHover
                } solid`,
              };
            },
          },
        }}
      >
        <Zoom in={cell !== undefined}>
          <span
            className="material-icons"
            style={{
              fontSize: "72px",
              color: !winCells.includes(id)
                ? theme.colors.buttonSecondaryText
                : theme.colors.accent,
            }}
          >
            {getIcon(cell)}
          </span>
        </Zoom>
      </Button>
    );
  };

  const gameBoard = (
    <div id="game-screen" className="center-board">
      <table className="center-board">
        <tbody>
          <tr>
            <td>
              <Grow in={true} timeout={300}>
                {getButton("cell00")}
              </Grow>
            </td>
            <td>
              <Grow in={true} timeout={300}>
                {getButton("cell01")}
              </Grow>
            </td>
            <td>
              <Grow in={true} timeout={300}>
                {getButton("cell02")}
              </Grow>
            </td>
          </tr>
          <tr>
            <td>
              <Grow in={true} timeout={400}>
                {getButton("cell10")}
              </Grow>
            </td>
            <td>
              <Grow in={true} timeout={400}>
                {getButton("cell11")}
              </Grow>
            </td>
            <td>
              <Grow in={true} timeout={400}>
                {getButton("cell12")}
              </Grow>
            </td>
          </tr>
          <tr>
            <td>
              <Grow in={true} timeout={500}>
                {getButton("cell20")}
              </Grow>
            </td>
            <td>
              <Grow in={true} timeout={500}>
                {getButton("cell21")}
              </Grow>
            </td>
            <td>
              <Grow in={true} timeout={500}>
                {getButton("cell22")}
              </Grow>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const gameComponent = (
    <div className="mgame-layout">
      <div className="center trim flex-auto">
        <Zoom in={true}>
          <div className="center-flex trim">
            <h1
              style={{
                fontWeight: "400",
                fontSize: "60px",
              }}
            >
              tictactoe
            </h1>
            <p
              style={{
                fontWeight: "300",
              }}
            >
              Room Code : <span style={{ fontWeight: "400" }}>{roomId}</span>
            </p>
            <div>
              <Tag
                closeable={false}
                kind={TagKIND.accent}
                variant={
                  playerOneName === undefined || playerOneName === null
                    ? VARIANT.light
                    : VARIANT.solid
                }
              >
                {playerOneName === undefined || playerOneName === null
                  ? "Waiting to join.."
                  : playerOneName}
              </Tag>{" "}
              <Tag
                closeable={false}
                kind={TagKIND.accent}
                variant={
                  playerTwoName === undefined || playerTwoName === null
                    ? VARIANT.light
                    : VARIANT.solid
                }
              >
                {playerTwoName === undefined || playerTwoName === null
                  ? "Waiting to join.."
                  : playerTwoName}
              </Tag>
            </div>
            <Collapse in={won}>
              <div
                style={{
                  marginTop: "10px",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  placeItems: "center",
                }}
              >
                <Notification
                  kind={
                    winner === "draw"
                      ? NotiKIND.info
                      : winner === currentPlayer
                      ? NotiKIND.positive
                      : NotiKIND.negative
                  }
                >
                  {winner === "draw"
                    ? `It's a tie game`
                    : winner === currentPlayer
                    ? "Congratulations, You won!"
                    : "Better luck next time"}
                </Notification>
                <Button
                  size={SIZE.compact}
                  kind={KIND.minimal}
                  onClick={restartGame}
                  overrides={{
                    BaseButton: {
                      style: () => {
                        return {
                          color: `${
                            winner === "draw"
                              ? theme.colors.notificationInfoText
                              : winner === currentPlayer
                              ? theme.colors.notificationPositiveText
                              : theme.colors.notificationNegativeText
                          }`,
                          backgroundColor: `${
                            winner === "draw"
                              ? theme.colors.notificationInfoBackground
                              : winner === currentPlayer
                              ? theme.colors.notificationPositiveBackground
                              : theme.colors.notificationNegativeBackground
                          }`,
                        };
                      },
                    },
                  }}
                  style={{
                    height: "48px",
                    width: "48px",
                    display: currentPlayer !== "player1" && "none",
                  }}
                >
                  <span className="material-icons">refresh</span>
                </Button>
              </div>
            </Collapse>
          </div>
        </Zoom>
      </div>
      <div className="center trim flex-auto">
        <Fade in={true}>{gameBoard}</Fade>
      </div>
    </div>
  );

  return (
    <div>
      {!isLoading ? (
        isError !== undefined ? (
          <div
            className={css({
              backgroundColor: theme.colors.background,
              color: theme.colors.backgroundInv,
            })}
          >
            <Fade in={true}>{isError ? errorComponent : gameComponent}</Fade>
          </div>
        ) : null
      ) : null}
    </div>
  );
};

export default ModernGameRoom;
