import React from "react";

const Modal = ({show, message, onClose}) => {
  const showHideClassName = show ? "modal d-block" : "modal d-none";

  return (
    <div className={showHideClassName}>
      <div className="modal-container">
        {message}
        <a style={{ float: "right" }} href="#error-message" onClick={onClose}><i className="fa fa-times" /></a>
      </div>
    </div>
  );
};

export default Modal;