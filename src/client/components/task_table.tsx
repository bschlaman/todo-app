import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import ReactMarkdown from "react-markdown";

export interface ProtoTask {
  title: string;
  description: string;
  storyId: string;
  created: boolean;
}

export default function ProtoTaskTable({ ptasks }: { ptasks: ProtoTask[] }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Story ID</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Created?</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ptasks.map((ptask, index) => (
            <TableRow key={index}>
              <TableCell>{ptask.storyId}</TableCell>
              <TableCell>{ptask.title}</TableCell>
              <TableCell>
                <ReactMarkdown>{ptask.description}</ReactMarkdown>
              </TableCell>
              <TableCell>{ptask.created ? "✅" : ""}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
