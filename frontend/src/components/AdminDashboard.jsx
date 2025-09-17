import FileManager from './FileManager.jsx';
import UserManagementPanel from './UserManagementPanel.jsx';
import ChangePasswordForm from './ChangePasswordForm.jsx';

const AdminDashboard = ({ user, onLogout, onPasswordChange, onRefreshUser }) => (
  <div className="dashboard">
    <header className="dashboard-header">
      <div>
        <h1>Welcome, {user.username}</h1>
        <p className="muted">You have administrator access to the HTS NAS.</p>
      </div>
      <button type="button" className="button danger" onClick={onLogout}>
        Sign out
      </button>
    </header>

    <section className="dashboard-section">
      <FileManager
        title="NAS file explorer"
        subtitle="Manage all files and folders stored on the NAS."
      />
    </section>

    <section className="dashboard-section">
      <UserManagementPanel onUsersChanged={onRefreshUser} />
    </section>

    <section className="dashboard-section">
      <ChangePasswordForm title="Update your administrator password" onSubmit={onPasswordChange} />
    </section>
  </div>
);

export default AdminDashboard;
