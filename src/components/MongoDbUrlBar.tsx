import React, { useEffect, useState } from "react";
import { Spinner, Form, InputGroup } from "react-bootstrap";

import { VALUE_STATES, DatabaseSpecification } from "../types";
import { AppState } from "../App";
import { ServerInfo } from "./ServerInfo";
import { mongodb_connect } from "../util";
import { isEmpty } from "lodash";
import { ServerMetric } from "./ServerMetric";

export type MongodbUrlBarProps = {
  url: string;
  port: number;
  status: VALUE_STATES;
  databases: Record<string, DatabaseSpecification>;
  databasesState: VALUE_STATES;
  databaseName: string | undefined;
  collectionName: string | undefined;
};

export const MONGODB_URL_BAR_INITIAL_STATE: MongodbUrlBarProps = {
  url: "localhost",
  port: 27017,
  status: VALUE_STATES.UNLOADED,
  databases: {},
  databasesState: VALUE_STATES.UNLOADED,
  databaseName: undefined,
  collectionName: undefined,
};

export const useMongodbUrlBarState = () => {
  const [state, setState] = useState<MongodbUrlBarProps>(
    MONGODB_URL_BAR_INITIAL_STATE
  );
  return {
    state,
    setState,
  };
};

export const MongoDbUrlBar = ({
  appStates,
}: Readonly<{ appStates: AppState }>) => {
  const {
    connectionData: {
      state: {
        url,
        port,
        status,
        databases,
        databasesState,
        databaseName,
        collectionName,
      },
      setState,
    },
    documentsTabState: { setState: setDocumentsTabState },
    serverInfoState: { setState: setServerInfoState },
    aggregateTabState: { setStagesOutput: setAggregateTabStagesOutputState },
    schemaTabState: { setState: setSchemaTabState },
    serverMetricState: { setState: setServerMetricState },
  } = appStates;

  useEffect(() => {
    const f = async () => {
      if (url && port && status === VALUE_STATES.UNLOADED) {
        try {
          setState((state) => ({
            ...state,
            status: VALUE_STATES.LOADING,
            databases: {},
            databasesState: VALUE_STATES.LOADING,
            databaseName: undefined,
            collectionsState: VALUE_STATES.UNLOADED,
            collectionName: undefined,
          }));
          const databases = await mongodb_connect({
            url,
            port,
          });
          console.log("databases", databases);
          setState((state) => ({
            ...state,
            status: VALUE_STATES.LOADED,
            databases,
            databasesState: VALUE_STATES.LOADED,
          }));
        } catch (error) {
          console.error(error);
          setState(MONGODB_URL_BAR_INITIAL_STATE);
        }
      }
    };
    f();
  }, [url, port, status, setState]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          columnGap: "5px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px",
            justifyContent: "flex-start",
          }}
        >
          <InputGroup.Text
            style={{
              width: "110px",
              height: "30px",
            }}
          >
            mongodb://
          </InputGroup.Text>
          <Form.Control
            style={{
              width: "100px",
              height: "30px",
            }}
            required
            type="text"
            value={url}
            onChange={(e) =>
              setState((state) => ({
                ...state,
                url: e.target.value,
              }))
            }
          />
          <Form.Control
            style={{
              width: "90px",
              height: "30px",
            }}
            required
            type="number"
            value={port}
            onChange={(e) =>
              setState((state) => ({
                ...state,
                port: parseInt(e.target.value),
              }))
            }
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px",
          }}
        >
          {/* CONNECT BUTTON */}
          <button
            disabled={status === VALUE_STATES.LOADING}
            style={{
              display: "flex",
              alignItems: "center",
              height: "30px",
            }}
            onClick={() =>
              setState((state) => ({
                ...state,
                status: VALUE_STATES.UNLOADED,
              }))
            }
          >
            {status === VALUE_STATES.LOADED ? "Refresh" : "Connect"}
          </button>
          {/* SERVER INFO BUTTON */}
          <>
            <button
              hidden={status !== VALUE_STATES.LOADED}
              style={{
                display: "flex",
                alignItems: "center",
                height: "30px",
              }}
              onClick={() =>
                setServerInfoState((state) => ({
                  ...state,
                  visible: true,
                }))
              }
            >
              Info
            </button>
            <ServerInfo appStates={appStates} />
          </>
          {/* SERVER METRIC BUTTON */}
          <>
            <button
              hidden={status !== VALUE_STATES.LOADED}
              style={{
                display: "flex",
                alignItems: "center",
                height: "30px",
              }}
              onClick={() =>
                setServerMetricState((state) => ({
                  ...state,
                  visible: true,
                }))
              }
            >
              Metric
            </button>
            <ServerMetric appStates={appStates} />
          </>
          {/* DATABASES SELECT */}
          <>
            {databasesState === VALUE_STATES.UNLOADED && <div></div>}
            {databasesState === VALUE_STATES.LOADING && (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            )}
            {databasesState === VALUE_STATES.LOADED && isEmpty(databases) && (
              <div>No databases available</div>
            )}
            {databasesState === VALUE_STATES.LOADED && !isEmpty(databases) && (
              <select
                name={databaseName}
                onChange={(value) =>
                  setState((state) => ({
                    ...state,
                    databaseName: value.target.value,
                  }))
                }
              >
                {!databaseName && <option key={0} value={undefined}></option>}
                {Object.keys(databases).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </>
          {/* COLLECTIONS SELECT */}
          <>
            {!databaseName && <div></div>}
            {databaseName && (
              <select
                name={collectionName}
                onChange={(value) => {
                  setState((state) => ({
                    ...state,
                    collectionName: value.target.value,
                  }));
                  setDocumentsTabState((state) => ({
                    ...state,
                    status: VALUE_STATES.UNLOADED,
                  }));
                  setAggregateTabStagesOutputState((state) =>
                    state.map((s) => ({
                      ...s,
                      status: VALUE_STATES.UNLOADED,
                    }))
                  );
                  setSchemaTabState((state) => ({
                    ...state,
                    status: VALUE_STATES.UNLOADED,
                  }));
                }}
              >
                {!collectionName && <option key={0} value={undefined}></option>}
                {databases[databaseName].collections.map(({ name }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </>
        </div>
      </div>
    </div>
  );
};
