import styled from 'styled-components';

// Change 10: style the network note like a small centered badge
export const NoteNav = styled.nav`
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 14px auto 10px;
  padding: 0 16px;
  
  @media (max-width: 32em) {
    margin: 12px auto 8px;
    padding: 0 12px;
  }
`;

export const NavBar = styled.nav`
  text-align: center;
  display: flex;
  margin-left: 10%;

`;

export const Note = styled.div`
  color: #334155;
  text-align: center;
  font-size: 14px;
  background: #eef2f7;
  border: 1px solid #d6dee8;
  border-radius: 999px;
  padding: 10px 16px;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
  max-width: 720px;
  width: fit-content;

  p {
    margin: 0;
  }

  @media (max-width: 32em) {
    width: 100%;
    border-radius: 18px;
    padding: 10px 14px;
  }
`;

