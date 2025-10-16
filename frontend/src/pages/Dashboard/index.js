import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from "@material-ui/core";
import TrendingUpIcon from "@material-ui/icons/TrendingUp";
import HomeWorkIcon from "@material-ui/icons/HomeWork";
import EventIcon from "@material-ui/icons/Event";
import AssignmentIcon from "@material-ui/icons/Assignment";
import AttachMoneyIcon from "@material-ui/icons/AttachMoney";
import PeopleIcon from "@material-ui/icons/People";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import { toast } from "react-toastify";
import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
  statCard: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  statIcon: {
    fontSize: 48,
    opacity: 0.3,
  },
  statValue: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginTop: theme.spacing(1),
  },
  statLabel: {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  sectionTitle: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
    fontWeight: "bold",
  },
  taskItem: {
    borderLeft: "4px solid",
    marginBottom: theme.spacing(1),
    "&.urgent": {
      borderLeftColor: "#f44336",
    },
    "&.high": {
      borderLeftColor: "#ff9800",
    },
    "&.medium": {
      borderLeftColor: "#2196f3",
    },
    "&.low": {
      borderLeftColor: "#4caf50",
    },
  },
  leadItem: {
    marginBottom: theme.spacing(1),
  },
}));

const Dashboard = () => {
  const classes = useStyles();
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    totalProperties: 0,
    activeProperties: 0,
    totalVisits: 0,
    scheduledVisits: 0,
    totalProposals: 0,
    activeProposals: 0,
  });
  const [tasks, setTasks] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, tasksRes, leadsRes] = await Promise.all([
        api.get("/analytics/dashboard").catch(() => null),
        api.get("/tasks", { params: { status: "pending" } }).catch(() => ({ data: { tasks: [] } })),
        api.get("/leads").catch(() => ({ data: { leads: [] } })),
      ]);

      if (analyticsRes && analyticsRes.data) {
        const analytics = analyticsRes.data;
        setStats({
          totalLeads: analytics.leads.total,
          newLeads: analytics.leads.new,
          totalProperties: analytics.properties.total,
          activeProperties: analytics.properties.available,
          totalVisits: analytics.visits.total,
          scheduledVisits: analytics.visits.scheduled,
          totalProposals: analytics.proposals.total,
          activeProposals: analytics.proposals.pending,
        });
      } else {
        const [leadsRes2, propertiesRes, visitsRes, proposalsRes] = await Promise.all([
          api.get("/leads").catch(() => ({ data: { leads: [] } })),
          api.get("/properties").catch(() => ({ data: { properties: [] } })),
          api.get("/visits").catch(() => ({ data: { visits: [] } })),
          api.get("/proposals").catch(() => ({ data: { proposals: [] } })),
        ]);

        const leads = leadsRes2.data.leads || [];
        const properties = propertiesRes.data.properties || [];
        const visits = visitsRes.data.visits || [];
        const proposals = proposalsRes.data.proposals || [];

        setStats({
          totalLeads: leads.length,
          newLeads: leads.filter((l) => l.status === "new").length,
          totalProperties: properties.length,
          activeProperties: properties.filter((p) => p.isActive).length,
          totalVisits: visits.length,
          scheduledVisits: visits.filter((v) => v.status === "scheduled").length,
          totalProposals: proposals.length,
          activeProposals: proposals.filter((p) =>
            ["sent", "viewed", "negotiating"].includes(p.status)
          ).length,
        });
      }

      const allTasks = tasksRes.data.tasks || [];
      const leads = leadsRes.data.leads || [];

      setTasks(allTasks.slice(0, 10));
      setRecentLeads(leads.slice(0, 5));
      setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard", err);
      setLoading(false);
    }
  };

  const getTaskPriorityClass = (priority) => {
    return priority || "medium";
  };

  const formatTaskDate = (date) => {
    if (!date) return "";
    const parsedDate = parseISO(date);
    if (isToday(parsedDate)) return "Hoje";
    if (isTomorrow(parsedDate)) return "Amanhã";
    if (isPast(parsedDate)) return "Atrasada";
    return format(parsedDate, "dd/MM/yyyy", { locale: ptBR });
  };

  const getLeadScoreColor = (score) => {
    if (score >= 75) return "#4caf50";
    if (score >= 50) return "#ff9800";
    return "#f44336";
  };

  if (loading) {
    return (
      <MainContainer>
        <MainHeader>
          <Title>Dashboard - MaisCRM</Title>
        </MainHeader>
        <Container maxWidth="lg" className={classes.container}>
          <Typography>Carregando...</Typography>
        </Container>
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <MainHeader>
        <Title>Dashboard - MaisCRM</Title>
      </MainHeader>
      <Container maxWidth="lg" className={classes.container}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.statCard}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography className={classes.statLabel}>Total de Leads</Typography>
                    <Typography className={classes.statValue}>{stats.totalLeads}</Typography>
                    <Chip
                      label={`${stats.newLeads} novos`}
                      size="small"
                      color="primary"
                      style={{ marginTop: 8 }}
                    />
                  </Box>
                  <TrendingUpIcon className={classes.statIcon} color="primary" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.statCard}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography className={classes.statLabel}>Imóveis</Typography>
                    <Typography className={classes.statValue}>{stats.totalProperties}</Typography>
                    <Chip
                      label={`${stats.activeProperties} ativos`}
                      size="small"
                      color="secondary"
                      style={{ marginTop: 8 }}
                    />
                  </Box>
                  <HomeWorkIcon className={classes.statIcon} color="secondary" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.statCard}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography className={classes.statLabel}>Visitas</Typography>
                    <Typography className={classes.statValue}>{stats.totalVisits}</Typography>
                    <Chip
                      label={`${stats.scheduledVisits} agendadas`}
                      size="small"
                      style={{ marginTop: 8, backgroundColor: "#ff9800", color: "#fff" }}
                    />
                  </Box>
                  <EventIcon className={classes.statIcon} style={{ color: "#ff9800" }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.statCard}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography className={classes.statLabel}>Propostas</Typography>
                    <Typography className={classes.statValue}>{stats.totalProposals}</Typography>
                    <Chip
                      label={`${stats.activeProposals} ativas`}
                      size="small"
                      style={{ marginTop: 8, backgroundColor: "#9c27b0", color: "#fff" }}
                    />
                  </Box>
                  <AttachMoneyIcon className={classes.statIcon} style={{ color: "#9c27b0" }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className={classes.paper}>
              <Typography variant="h6" className={classes.sectionTitle}>
                <AssignmentIcon style={{ verticalAlign: "middle", marginRight: 8 }} />
                Minhas Tarefas
              </Typography>
              <List>
                {tasks.length === 0 ? (
                  <Typography color="textSecondary">Nenhuma tarefa pendente</Typography>
                ) : (
                  tasks.map((task) => (
                    <ListItem
                      key={task.id}
                      className={`${classes.taskItem} ${getTaskPriorityClass(task.priority)}`}
                    >
                      <ListItemAvatar>
                        <Avatar style={{ backgroundColor: "#2196f3" }}>
                          <AssignmentIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {formatTaskDate(task.dueDate)}
                            </Typography>
                            {task.lead && ` - ${task.lead.name}`}
                          </>
                        }
                      />
                      <Chip label={task.priority} size="small" />
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className={classes.paper}>
              <Typography variant="h6" className={classes.sectionTitle}>
                <PeopleIcon style={{ verticalAlign: "middle", marginRight: 8 }} />
                Leads Recentes
              </Typography>
              <List>
                {recentLeads.length === 0 ? (
                  <Typography color="textSecondary">Nenhum lead recente</Typography>
                ) : (
                  recentLeads.map((lead) => (
                    <ListItem key={lead.id} className={classes.leadItem}>
                      <ListItemAvatar>
                        <Avatar style={{ backgroundColor: getLeadScoreColor(lead.score) }}>
                          {lead.score}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={lead.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {lead.source}
                            </Typography>
                            {` - ${lead.email || lead.phone || "Sem contato"}`}
                          </>
                        }
                      />
                      <Chip label={lead.status} size="small" color="primary" />
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </MainContainer>
  );
};

export default Dashboard;