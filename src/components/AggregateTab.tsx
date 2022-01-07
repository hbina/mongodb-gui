import { cloneDeep, chain } from "lodash";
import { useState } from "react";
import {
  Button,
  Card,
  Dropdown,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import ReactJson from "react-json-view";
import { AppState } from "../App";

import { AggregationStageInput, AggregationStageOutput } from "../types";
import { useWindowDimensions } from "../util";

const AGGREGATE_OPERATIONS = [
  "$addFields",
  "$bucket",
  "$bucketAuto",
  "$collStats",
  "$count",
  "$documents",
  "$facet",
  "$geoNear",
  "$graphLookup",
  "$group",
  "$indexStats",
  "$limit",
  "$lookup",
  "$match",
  "$merge",
  "$out",
  "$project",
  "$redact",
  "$replaceWidth",
  "$replaceRoot",
  "$sample",
  "$search",
  "$searchMeta",
  "$set",
  "$skip",
  "$sort",
  "$sortByCount",
  "$unionWidth",
  "$unset",
  "$unwind",
];

export const useAggregateTabState = () => {
  const [sampleCount, setSampleCount] = useState(2);
  const [stagesInput, setStagesInput] = useState<AggregationStageInput[]>([
    {
      collapsed: false,
      stageOperation: "$match",
      stageBody: "{}",
    },
  ]);
  const [stagesOutput, setStagesOutput] = useState<AggregationStageOutput[]>([
    {
      loading: false,
      documents: [],
    },
  ]);

  return {
    sampleCount,
    setSampleCount,
    stagesInput,
    setStagesInput,
    stagesOutput,
    setStagesOutput,
  };
};

export const AggregateTab = ({
  appStates: {
    functions: { mongodb_aggregate_documents },
    connectionData,
    aggregateTab: {
      stagesInput,
      setStagesInput,
      stagesOutput,
      setStagesOutput,
      sampleCount,
      setSampleCount,
    },
  },
}: Readonly<{
  appStates: AppState;
}>) => {
  const { height } = useWindowDimensions();
  const [validated, setValidated] = useState(false);

  const handleSubmit = (event: {
    currentTarget: any;
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }

    setValidated(true);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        rowGap: "10px",
        paddingTop: "5px",
        // TODO: This is mostly a hack
        minHeight: `${Math.max(0, height - 100)}px`,
      }}
    >
      <div>
        <Form
          style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px",
            justifyContent: "flex-start",
          }}
          noValidate
          validated={validated}
          onSubmit={handleSubmit}
        >
          <Form.Group
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <InputGroup.Text>Sample count</InputGroup.Text>
                <Form.Control
                  required
                  type="number"
                  disabled={chain(stagesOutput)
                    .some((s) => s.loading)
                    .value()}
                  onChange={(v) =>
                    setSampleCount(Math.max(0, parseInt(v.target.value)))
                  }
                  value={sampleCount}
                />
              </div>
            </div>
          </Form.Group>
          <Button
            disabled={chain(stagesOutput)
              .some((s) => s.loading)
              .value()}
            onClick={() => {
              stagesInput
                .map((_a, idx) => stagesInput.filter((_b, idx2) => idx2 <= idx))
                .forEach((stages, idx) =>
                  mongodb_aggregate_documents({
                    idx,
                    sampleCount,
                    databaseName: connectionData.databaseName,
                    collectionName: connectionData.collectionName,
                    stages,
                  })
                );
            }}
          >
            Refresh
          </Button>
        </Form>
      </div>
      {stagesInput
        .map((l, i) => ({ ...l, ...stagesOutput[i] }))
        .map(
          (
            { collapsed, stageOperation, stageBody, documents, loading },
            rowIdx
          ) => (
            <Card
              style={{
                padding: "10px",
                overflowY: "auto",
              }}
            >
              <div
                key={rowIdx}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  columnGap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingBottom: "5px",
                      minWidth: "400px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        columnGap: "1px",
                      }}
                    >
                      <Button
                        disabled={loading}
                        onClick={() =>
                          setStagesInput((stages) => {
                            const copy = cloneDeep(stages);
                            copy[rowIdx].collapsed = copy[rowIdx].collapsed
                              ? false
                              : true;
                            return copy;
                          })
                        }
                      >
                        {collapsed ? "Expand" : "Collapse"}
                      </Button>
                      <Dropdown>
                        <Dropdown.Toggle variant="success" id="dropdown-basic">
                          {stageOperation || "$match"}
                        </Dropdown.Toggle>
                        <Dropdown.Menu
                          style={{
                            maxHeight: "500px",
                            overflowY: "auto",
                          }}
                        >
                          {AGGREGATE_OPERATIONS.map((name, idx) => (
                            <Dropdown.Item
                              eventKey={idx}
                              onClick={() =>
                                setStagesInput((stages) => {
                                  const copy = cloneDeep(stages);
                                  copy[rowIdx].stageOperation = name;
                                  return copy;
                                })
                              }
                            >
                              {name}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        columnGap: "1px",
                      }}
                    >
                      <Button
                        disabled={loading}
                        onClick={() => {
                          setStagesInput((stages) =>
                            cloneDeep(stages.filter((v, idx) => idx !== rowIdx))
                          );
                          setStagesOutput((stages) =>
                            cloneDeep(stages.filter((v, idx) => idx !== rowIdx))
                          );
                        }}
                      >
                        Delete
                      </Button>
                      <Button
                        onClick={() => {
                          setStagesInput((stages) => {
                            const leftCopy = cloneDeep(
                              stages.filter((v, idx) => idx <= rowIdx)
                            );
                            const rightCopy = cloneDeep(
                              stages.filter((v, idx) => idx > rowIdx)
                            );
                            return [
                              ...leftCopy,
                              {
                                collapsed: false,
                                stageOperation: "$match",
                                stageBody: "{}",
                              },
                              ...rightCopy,
                            ];
                          });
                          setStagesOutput((stages) => {
                            const leftCopy = cloneDeep(
                              stages.filter((v, idx) => idx <= rowIdx)
                            );
                            const rightCopy = cloneDeep(
                              stages.filter((v, idx) => idx > rowIdx)
                            );
                            return [
                              ...leftCopy,
                              {
                                loading: false,
                                documents: [],
                              },
                              ...rightCopy,
                            ];
                          });
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  {!collapsed && (
                    <textarea
                      style={{
                        display: "flex",
                      }}
                      onChange={(value) =>
                        setStagesInput((stages) => {
                          const copy = cloneDeep(stages);
                          try {
                            const json = JSON.stringify(
                              JSON.parse(value.target.value)
                            );
                            copy[rowIdx].stageBody = json;
                          } catch (e) {
                            copy[rowIdx].stageBody = value.target.value;
                          }
                          return copy;
                        })
                      }
                      value={stageBody}
                    />
                  )}
                </div>
                {!collapsed && (
                  <div key={rowIdx}>
                    {loading ? (
                      <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </Spinner>
                    ) : (
                      <div>
                        {documents.length === 0 ? (
                          <div>No documents found</div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              overflowX: "auto",
                              columnGap: "5px",
                            }}
                          >
                            {documents.map((document, colIdx) => (
                              <div
                                key={colIdx}
                                style={{
                                  display: "flex",
                                }}
                              >
                                <Card
                                  style={{
                                    display: "flex",
                                  }}
                                >
                                  <Card.Body>
                                    <ReactJson
                                      name={false}
                                      src={document}
                                      collapsed={1}
                                      iconStyle="square"
                                      indentWidth={2}
                                      displayObjectSize={false}
                                      displayDataTypes={false}
                                      enableClipboard={false}
                                      sortKeys={true}
                                    />
                                  </Card.Body>
                                </Card>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )
        )}
      <Button
        onClick={() => {
          setStagesInput((stages) => {
            const copy = [
              ...cloneDeep(stages),
              {
                collapsed: false,
                stageOperation: "$match",
                stageBody: "{}",
              },
            ];
            return copy;
          });
          setStagesOutput((stages) => {
            const copy = [
              ...cloneDeep(stages),
              {
                loading: false,
                documents: [],
              },
            ];
            return copy;
          });
        }}
      >
        Add stage
      </Button>
    </div>
  );
};
