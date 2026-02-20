import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase'; // Adjust this path to your firebase config file
import { 
    collection, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc 
} from 'firebase/firestore';

// --- Direct Grid Import ---
import Grid from '@mui/material/Grid'; 

// --- Other Material-UI Imports ---
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Modal,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Chip,
    CircularProgress,
    Alert,
    useTheme,
    useMediaQuery
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { EmployeeLogin } from '../types/employeeLogin';

// --- Type Definitions ---
interface TeamMember {
    id: string;
    name: string; 
}

interface Team {
    id: string;
    teamName: string;
    managerId: string;
    managerName: string;
    staff: TeamMember[];
}

const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: '75%', md: '500px' },
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: { xs: 2, sm: 3, md: 4 },
    borderRadius: 2,
};

// --- The Main Component ---
const ManageTeams: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [employees, setEmployees] = useState<EmployeeLogin[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    // --- NEW STATE FOR DELETE CONFIRMATION ---
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [teamToDeleteId, setTeamToDeleteId] = useState<string | null>(null);
    
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [teamName, setTeamName] = useState<string>('');
    const [selectedManager, setSelectedManager] = useState<string>('');
    const [selectedStaff, setSelectedStaff] = useState<TeamMember[]>([]);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Detects small screens

    useEffect(() => {
        const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
            const employeesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeLogin));
            setEmployees(employeesData);
        }, (err) => setError('Failed to load employees.'));

        const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
            const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
            setTeams(teamsData);
            setLoading(false);
        }, (err) => {
            setError('Failed to load teams.');
            setLoading(false);
        });

        return () => { unsubEmployees(); unsubTeams(); };
    }, []);
    
    const managers = useMemo(() => employees.filter(e => e.role === 'manager'), [employees]);
    const staff = useMemo(() => employees.filter(e => e.role === 'staff'), [employees]);

    const handleOpenModal = (team: Team | null = null) => {
        setCurrentTeam(team);
        if (team) {
            setTeamName(team.teamName);
            setSelectedManager(team.managerId);
            setSelectedStaff(team.staff || []); // Add fallback for safety
        } else {
            setTeamName('');
            setSelectedManager('');
            setSelectedStaff([]);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSaveTeam = async () => {
        // Replaced browser alert()
        if (!teamName || !selectedManager) return console.error('Please fill in Team Name and select a Manager.');
        const manager = managers.find(m => m.id === selectedManager);
        if (!manager) return console.error('Invalid manager selected.');
        
        const teamData = { 
            teamName, 
            managerId: manager.id!, 
            managerName: manager.employeeName, 
            staff: selectedStaff 
        };

        try {
            if (currentTeam) {
                await updateDoc(doc(db, 'teams', currentTeam.id), teamData);
            } else {
                await addDoc(collection(db, 'teams'), teamData);
            }
            handleCloseModal();
        } catch (err) {
            console.error('Failed to save team:', err);
        }
    };
    
    // --- NEW: Delete Confirmation Logic ---
    const openConfirmDelete = (teamId: string) => {
        setTeamToDeleteId(teamId);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!teamToDeleteId) return;
        try {
            await deleteDoc(doc(db, 'teams', teamToDeleteId));
        } catch (err) {
            console.error('Failed to delete team:', err);
        } finally {
            setTeamToDeleteId(null);
            setIsConfirmOpen(false);
        }
    };
    // --- END NEW: Delete Confirmation Logic ---

    const renderContent = () => {
        if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
        if (error) return <Alert severity="error">{error}</Alert>;
        if (!teams || teams.length === 0) return <Typography sx={{ textAlign: 'center', mt: 4 }}>No teams found. Click "Create New Team" to get started.</Typography>;
        
        if (isMobile) {
            return (
                <Grid container spacing={2}>
                    {teams.map((team) => (
                        <Grid item xs={12} key={team.id}>
                            <Card variant="outlined">
                                <CardHeader
                                    title={team.teamName}
                                    subheader={`Manager: ${team.managerName}`}
                                    action={
                                        <>
                                            <IconButton onClick={() => handleOpenModal(team)}><EditIcon /></IconButton>
                                            <IconButton onClick={() => openConfirmDelete(team.id)}><DeleteIcon /></IconButton>
                                        </>
                                    }
                                />
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>Members:</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {(team.staff || []).map(member => <Chip key={member.id} label={member.name} size="small" />)}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            );
        }

        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead><TableRow><TableCell>Team Name</TableCell><TableCell>Manager</TableCell><TableCell>Members</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                    <TableBody>
                        {teams.map((team) => (
                            <TableRow key={team.id}>
                                <TableCell>{team.teamName}</TableCell>
                                <TableCell>{team.managerName}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {(team.staff || []).map(member => <Chip key={member.id} label={member.name} size="small" />)}
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleOpenModal(team)} color="primary"><EditIcon /></IconButton>
                                    <IconButton onClick={() => openConfirmDelete(team.id)} color="error"><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: 'grey.50', minHeight: '100vh' }}>
            {/* FIX: Added sx to Grid container to push content right on mobile, using negative margin to counter the page padding */}
            <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3, ml: { xs: 5, sm: 0 }, width: { xs: 'calc(100% - 40px)', sm: '100%' } }}>
                <Grid item>
                    <Typography variant="h4" component="h1">Team Management</Typography>
                    <Typography variant="subtitle1" color="text.secondary">View, create, and manage your teams</Typography>
                </Grid>
                <Grid item>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal(null)}>
                        {isMobile ? 'New' : 'Create New Team'}
                    </Button>
                </Grid>
            </Grid>

            {renderContent()}

            {/* Modal for Add/Edit Team */}
            <Modal open={isModalOpen} onClose={handleCloseModal}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" component="h2" mb={2}>{currentTeam ? 'Edit Team' : 'Create New Team'}</Typography>
                    <TextField fullWidth label="Team Name" value={teamName} onChange={(e) => setTeamName(e.target.value)} margin="normal" />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Select Manager</InputLabel>
                        <Select value={selectedManager} label="Select Manager" onChange={(e) => setSelectedManager(e.target.value as string)}>
                            {managers.map(m => <MenuItem key={m.id} value={m.id!}>{m.employeeName}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Autocomplete
                        multiple
                        options={staff}
                        getOptionLabel={(option) => option.employeeName}
                        value={staff.filter(s => selectedStaff.some(ss => ss.id === s.id))}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        onChange={(event, newValue) => {
                            const newStaffSelection = newValue.map(emp => ({ id: emp.id!, name: emp.employeeName }));
                            setSelectedStaff(newStaffSelection);
                        }}
                        renderInput={(params) => <TextField {...params} label="Assign Staff Members" margin="normal" />}
                    />
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={handleCloseModal}>Cancel</Button>
                        <Button variant="contained" onClick={handleSaveTeam}>Save Team</Button>
                    </Box>
                </Box>
            </Modal>

            {/* NEW: Delete Confirmation Modal */}
            <Modal open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" component="h2" mb={2} color="error">Confirm Deletion</Typography>
                    <Typography>
                        Are you sure you want to delete this team? This action cannot be undone.
                    </Typography>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                        <Button variant="contained" color="error" onClick={confirmDelete}>Delete</Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default ManageTeams;
