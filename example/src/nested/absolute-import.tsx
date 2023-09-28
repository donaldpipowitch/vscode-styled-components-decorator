import { Example, Other } from '../example';
import { Example2 } from 'src/example-2';
import styled from 'styled-components';

const Button = styled.button``;

const Bar = () => <div>Bar</div>;

export const Usage = () => (
  <>
    <Bar />
    <Example />
    <p>
      Some text.
      <Other />
    </p>
    <Button>Click me!</Button>
    <Example2>Hello</Example2>
  </>
);
