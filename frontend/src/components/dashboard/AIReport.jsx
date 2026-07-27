import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function AIReport({ report }) {
  if (!report) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mt: 3,
        borderRadius: 3,
      }}
    >
      <Typography variant="h5" gutterBottom>
        AI Business Report
      </Typography>

      <Typography
        sx={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.8,
        }}
      >
        {report}
      </Typography>
    </Paper>
  );
}