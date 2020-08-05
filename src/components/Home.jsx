import React, { useContext, useState, useEffect } from "react";

import Fade from "@material-ui/core/Fade";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalButton,
  SIZE,
  ROLE,
} from "baseui/modal";
import { Button, KIND } from "baseui/button";
import { Input } from "baseui/input";
import { useStyletron } from "baseui";

import { useHistory } from "react-router-dom";
import { reactLocalStorage as Storage } from "reactjs-localstorage";

import SocketContext from "../context/AppContext";

//Home screen of the app

//Operations we do here:
//Create a room
//Join to a existing room

const Home = () => {
  const [css, theme] = useStyletron();
  const history = useHistory();

  const {
    appProps: { socket },
    pageStateProps: { setLoading, setValidRedirect },
    toastProps: { toggleAlert },
  } = useContext(SocketContext);

  //state for changing model behaviour
  const [modal, setModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalBody, setModalBody] = useState(null);
  const [positiveText, setPositiveText] = useState("");

  //state for capturing inputs
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    document.title = "tictactoe | Home";

    //Function to handle once the room has been created
    socket.on("created-room", ({ name, roomId }) => {
      Storage.set("id", socket.id);
      Storage.set("name", name);
      Storage.set("roomId", roomId);
      setValidRedirect(true);
      toggleAlert("Room created successfully :thumbsup:", "success");
      history.push(`/room/${roomId}`);
      setLoading(false);
    });

    //Function to handle once the user has joined to room
    socket.on("joined-room", ({ name, roomId }) => {
      Storage.set("id", socket.id);
      Storage.set("name", name);
      Storage.set("roomId", roomId);
      setValidRedirect(true);
      history.push(`/room/${roomId}`);
      setLoading(false);
    });

    socket.on("redirect", (path) => {
      history.replace(path);
      setLoading(false);
    });
  }, []);

  //UTILITY FUNCTIONS

  const createRoom = () => {
    if (name.replaceAll(" ", "").length === 0) return;
    setLoading(true);
    //send a create room request
    socket.emit("create-room", { name });
    setModal(false);
  };

  const joinRoom = () => {
    if (
      name.replaceAll(" ", "").length === 0 ||
      roomId.replaceAll(" ", "").length === 0
    )
      return;
    setLoading(true);
    //send a join room request
    socket.emit("join-room", { name, roomId });
    setModal(false);
  };

  const toggle = () => {
    setName("");
    setRoomId("");
    setModal(!modal);
  };

  //MODAL

  const openModalForCreation = () => {
    setModalTitle("Create Room");
    setModalBody(bodyForCreate);
    setPositiveText("Create Room");
    toggle();
  };

  const openModalForJoining = () => {
    setModalTitle("Join Room");
    setModalBody(bodyForJoin);
    setPositiveText("Join Room");
    toggle();
  };

  //COMPONENTS

  const bodyForCreate = (
    <Input
      placeholder="Your Name"
      onChange={(e) => {
        setName(e.target.value);
      }}
    />
  );

  const bodyForJoin = (
    <div className="center trim" style={{ gridRowGap: "10px" }}>
      <Input
        placeholder="Your Name"
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Room code"
        onChange={(e) => setRoomId(e.target.value)}
      />
    </div>
  );

  return (
    <React.Fragment>
      <div
        className={css({
          backgroundColor: theme.colors.background,
          color: theme.colors.backgroundInv,
        })}
      >
        <Fade in={true}>
          <div className="center-flex">
            <h1
              style={{
                fontWeight: "400",
                fontSize: "60px",
              }}
            >
              tictactoe
            </h1>
            <p style={{ fontWeight: "300" }}>
              Just a normal popular children's game
            </p>
            <div>
              <Button onClick={openModalForCreation}>Create Room</Button>{" "}
              <Button kind={KIND.secondary} onClick={openModalForJoining}>
                Join Room
              </Button>
            </div>
          </div>
        </Fade>
      </div>

      {/*Adaptive Modal - content changes based on the button clicked*/}
      <Modal
        onClose={toggle}
        isOpen={modal}
        animate
        size={SIZE.default}
        role={ROLE.dialog}
      >
        <ModalHeader>{modalTitle}</ModalHeader>
        <ModalBody>{modalBody}</ModalBody>
        <ModalFooter>
          <ModalButton kind={KIND.tertiary} onClick={toggle}>
            Cancel
          </ModalButton>
          <ModalButton
            onClick={positiveText === "Create Room" ? createRoom : joinRoom}
          >
            {positiveText}
          </ModalButton>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default Home;
