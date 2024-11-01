import React from 'react';
import { Fa } from "@fa/ui";
import { Col, Row } from "antd";


export interface FaFormColProps extends Fa.BaseChildProps {
  offset?: number;
}

/**
 * @author xu.pengfei
 * @date 2024/10/8 14:08
 */
export default function FaFormCol({ offset = 3, children }: FaFormColProps) {
  return (
    <Row>
      <Col offset={offset}>
        {children}
      </Col>
    </Row>
  )
}