import React, { useContext } from "react";

import { Button, KIND as ButtonKIND, SIZE } from "baseui/button";
import Zoom from "@material-ui/core/Zoom";

import AppContext from "../context/AppContext";
import { reactLocalStorage as Storage } from "reactjs-localstorage";

//A switch to toggle themes

const DayNightSwitch = () => {
  const {
    themeProps: { isDark, setIsDark, animating, setAnimating },
  } = useContext(AppContext);

  const toggleTheme = (e) => {
    e.target.blur();
    Storage.set("darkTheme", !isDark);
    setAnimating(false);
    setTimeout(() => {
      setIsDark(!isDark);
      setAnimating(true);
    }, 300);
  };

  return (
    <Button
      kind={ButtonKIND.minimal}
      size={SIZE.large}
      onClick={toggleTheme}
      style={{ position: "absolute", top: "0", right: "0" }}
    >
      <Zoom in={animating}>
        <span className="material-icons">
          {isDark ? "wb_sunny" : "nights_stay"}
        </span>
      </Zoom>
    </Button>
  );
};

export default DayNightSwitch;
