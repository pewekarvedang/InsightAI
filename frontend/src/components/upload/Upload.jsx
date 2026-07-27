import "./Upload.css";
import { useState } from "react";
import api from "../../services/api";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function Upload({ setDashboard, setAiReport }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const response = await api.post("/dashboard", formData);
      
      setDashboard(response.data.dashboard);
      setAiReport(response.data.ai_report);

    } catch (err) {
    console.error(err);

    if (err.response) {
        console.log(err.response.data);
        alert(err.response.data.detail);
    } else {
        alert("Upload Failed");
    }
}

    setLoading(false);
  }

return (

<Paper
    elevation={3}
    sx={{
        p:5,
        mb:4,
        borderRadius:3,
        textAlign:"center"
    }}
>

<CloudUploadIcon
    color="primary"
    sx={{ fontSize:60 }}
/>

<Typography
    variant="h5"
    mt={2}
>
Upload Dataset
</Typography>

<Typography
    color="text.secondary"
    mb={3}
>
Upload CSV or Excel file for analysis.
</Typography>

<Button
    variant="contained"
    component="label"
>

Choose File

<input
hidden
type="file"
accept=".csv,.xlsx"
onChange={(e)=>setFile(e.target.files[0])}
/>

</Button>

<Typography mt={2}>

{file
? file.name
: "No file selected"}

</Typography>

<Button
variant="contained"
size="large"
sx={{ mt:3 }}
onClick={handleUpload}
disabled={loading}
>

{loading
? "Analyzing..."
: "Analyze Dataset"}

</Button>

</Paper>

);
(

<Paper
    elevation={3}
    sx={{
        p:5,
        mb:4,
        borderRadius:3,
        textAlign:"center"
    }}
>

<CloudUploadIcon
    color="primary"
    sx={{ fontSize:60 }}
/>

<Typography
    variant="h5"
    mt={2}
>
Upload Dataset
</Typography>

<Typography
    color="text.secondary"
    mb={3}
>
Upload CSV or Excel file for analysis.
</Typography>

<Button
    variant="contained"
    component="label"
>

Choose File

<input
hidden
type="file"
accept=".csv,.xlsx"
onChange={(e)=>setFile(e.target.files[0])}
/>

</Button>

<Typography mt={2}>

{file
? file.name
: "No file selected"}

</Typography>

<Button
variant="contained"
size="large"
sx={{ mt:3 }}
onClick={handleUpload}
disabled={loading}
>

{loading
? "Analyzing..."
: "Analyze Dataset"}

</Button>

</Paper>

);}