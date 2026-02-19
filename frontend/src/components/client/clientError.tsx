import React from "react";

type Props = {
  errRef: React.RefObject<HTMLParagraphElement | null>;
  errMsg: string;
};

const ClientError = ({ errRef, errMsg }: Props) => {
  return (
    <p
      ref={errRef}
      className={errMsg ? "errmsg" : "offscreen"}
      aria-live="assertive"
    >
      {errMsg}
    </p>
  );
};

export default ClientError;
