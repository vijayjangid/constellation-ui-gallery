import {
  type EdgeProps,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge
} from 'reactflow';

const CustomEdge = (props: EdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerStart,
    markerEnd
  } = props;
  let edgePath: string;
  let labelX: number;
  let labelY: number;
  if (data.path === 'straight') {
    [edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY
    });
  } else if (data.path === 'step') {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition
    });
  } else {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition
    });
  }

  let className = 'custom-edge nodrag nopan';
  if (data.type) {
    className += ` ${data.type.toLowerCase()}`;
  }
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={{
          strokeWidth: 2,
          stroke: data.theme.base.palette['foreground-color']
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`
          }}
          className={className}
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
