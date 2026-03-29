import React from 'react';
import { useParams } from 'react-router-dom';

const ProjectPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    return (
        <div>
            <h1>Project Details</h1>
            <p>Project ID: {id}</p>
        </div>
    );
};

export default ProjectPage;
