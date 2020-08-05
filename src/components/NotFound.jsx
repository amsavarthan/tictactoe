import React from "react";

import Fade from "@material-ui/core/Fade";
import { Button, KIND, SIZE } from "baseui/button";
import { useStyletron } from "baseui";

import { useHistory } from "react-router-dom";
import { ReactSVG } from "react-svg";

//Just a 404 Page

function NotFound() {
  const history = useHistory();
  const [css, theme] = useStyletron();

  return (
    <div
      className={css({
        backgroundColor: theme.colors.background,
        color: theme.colors.backgroundInv,
      })}
    >
      <Fade in={true}>
        <div className="center-flex">
          <ReactSVG
            style={{ height: "260px", width: "260px" }}
            src={require("../images/404.svg")}
          />
          <h1
            style={{
              fontWeight: "400",
              fontSize: "48px",
            }}
          >
            Oops!
          </h1>
          <p style={{ fontWeight: "300" }}>Page not found</p>
          <Button
            kind={KIND.primary}
            size={SIZE.compact}
            onClick={() => {
              history.push("/");
            }}
          >
            Go to Home
          </Button>
          <a
            style={{ position: "absolute", bottom: "10px" }}
            href="https://stories.freepik.com/people"
          >
            Illustration by Stories by Freepik
          </a>
        </div>
      </Fade>
    </div>
  );
}

export default NotFound;
