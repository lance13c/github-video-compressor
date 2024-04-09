import { FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa'
import { INSTALL_STATUS, InstallStatus } from '~/src/shared/constants'

interface Props {
  status: InstallStatus
}

const StatusIcon: React.FC<Props> = ({ status }) => {
  switch (status) {
    case INSTALL_STATUS.INSTALLED:
    case INSTALL_STATUS.ALREADY_INSTALLED:
      return <FaCheckCircle className="text-green-500" />
    case INSTALL_STATUS.INSTALLING:
      return <FaSpinner className="animate-spin" />
    case INSTALL_STATUS.FAILED:
      return <FaExclamationCircle className="text-red-500" />
    case INSTALL_STATUS.UNINSTALLED:
      return <FaCheckCircle className="text-gray-300" />
    default:
      return null
  }
}

export default StatusIcon
