import { Spin } from "antd";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { useGetMeQuery } from "../authApi.js";
import { clearAuth, setAuthInitialized, setUser } from "../authSlice.js";

export function AuthInitializer({ children }) {
  const dispatch = useDispatch();

  const { data, isSuccess, isError } = useGetMeQuery();

  useEffect(() => {
    if (isSuccess) {
      dispatch(setUser(data.data));
      dispatch(setAuthInitialized(true));
    }

    if (isError) {
      dispatch(clearAuth());
      dispatch(setAuthInitialized(true));
    }
  }, [data, isSuccess, isError, dispatch]);

  if (!isSuccess && !isError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return children;
}
