import React, { createContext, useState } from "react";

export const UpdateContext = createContext();

export const ArtContextProvider = ({ children }) => {
  const [fetchTrigger, setFetchTrigger] = useState(true);
  const [deleteUploadedTrigger, setDeleteUploadedTrigger] = useState(false);

  return (
    <UpdateContext.Provider
      value={{
        fetchTrigger,
        setFetchTrigger,
        deleteUploadedTrigger,
        setDeleteUploadedTrigger,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
};
