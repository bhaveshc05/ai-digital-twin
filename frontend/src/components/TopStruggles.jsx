import React, { useState, useEffect, useCallback } from "react";
import { Card, ListGroup, Badge, Spinner, Alert } from "react-bootstrap";

// Change this if your Node backend runs on a different port/path
const API_BASE = "http://localhost:5000";

// Pick a badge color based on how risky the score is (0-100 scale assumed)
function getRiskColor(score) {
    if (score >= 70) return "danger";   // high risk - red
    if (score >= 40) return "warning";  // medium risk - yellow
    return "success";                   // low risk - green
}

export default function TopStruggles({ studentId, refreshInterval = 30000 }) {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTopStruggles = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/students/${studentId}/top-struggles`);
            if (!res.ok) throw new Error("Failed to load struggle scores");
            const data = await res.json();
            setTopics(data.slice(0, 5)); // just in case backend sends more than 5
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        fetchTopStruggles(); // load once immediately

        // then keep checking for new scores every `refreshInterval` ms
        const timer = setInterval(fetchTopStruggles, refreshInterval);
        return () => clearInterval(timer); // cleanup when component unmounts
    }, [fetchTopStruggles, refreshInterval]);

    return (
        <Card className="shadow-sm">
            <Card.Header as="h5">Top Struggles</Card.Header>
            <Card.Body>
                {loading && (
                    <div className="text-center py-3">
                        <Spinner animation="border" size="sm" /> Loading...
                    </div>
                )}

                {error && <Alert variant="danger">{error}</Alert>}

                {!loading && !error && topics.length === 0 && (
                    <Card.Text className="text-muted">No struggle data yet.</Card.Text>
                )}

                {!loading && !error && topics.length > 0 && (
                    <ListGroup variant="flush">
                        {topics.map((topic) => (
                            <ListGroup.Item
                                key={topic.topic_id || topic.name}
                                className="d-flex justify-content-between align-items-center"
                            >
                                {topic.name}
                                <Badge bg={getRiskColor(topic.score)} pill>
                                    {topic.score}
                                </Badge>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Card.Body>
        </Card>
    );
}/.