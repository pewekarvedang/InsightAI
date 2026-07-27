import { useState } from "react";

import "../styles/dashboard.css";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import Navbar from "../components/layout/Navbar";
import Upload from "../components/upload/Upload";
import KPICards from "../components/dashboard/KPICards";
import Charts from "../components/dashboard/Charts";
import Insights from "../components/dashboard/Insights";
import AIReport from "../components/dashboard/AIReport";

export default function Dashboard() {

    const [dashboard, setDashboard] = useState(null);
    const [aiReport, setAiReport] = useState("");
  return (
    <>
    <Navbar />

    <Container
        maxWidth="xl"
        sx={{ mt:4 }}
    >

        <Typography
            variant="h4"
            gutterBottom
        >
            AI Business Intelligence Dashboard
        </Typography>

        <Typography
            color="text.secondary"
            mb={4}
        >
            Upload your business dataset and generate
            AI-powered insights instantly.
        </Typography>

        <Upload setDashboard={setDashboard}
        setAiReport={setAiReport}/>

        {dashboard && (
            <>
                <KPICards dashboard={dashboard}/>

                <Charts dashboard={dashboard}/>

                <AIReport report={aiReport} />

                <Insights dashboard={dashboard}/>
            </>
        )}

    </Container>
</>
  );}