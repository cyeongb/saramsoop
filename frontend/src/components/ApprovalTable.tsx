import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  GridLogicOperator,
  type GridRowSelectionModel,
  type GridPaginationModel,
  type GridSortModel,
  type GridRowId,
  GridToolbar,
} from '@mui/x-data-grid';
import { Chip, Button, Stack, Typography, Box, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import type { ApprovalDto, ApprovalListRequest } from '../services/approvalService';

// ApprovalDto에 맞춘 테이블 Props
interface ApprovalTableProps {
  // 데이터 관련
  rows: ApprovalDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  loading?: boolean;

  // 선택 관련
  selectedIds: GridRowId[];
  onSelectionChange: (ids: GridRowId[]) => void;

  // 액션 핸들러
  onDetail: (id: number) => void;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onFilterChange: (filters: Partial<ApprovalListRequest>) => void;
  onApprovalAction?: (id: number, action: 'approve' | 'reject', comment?: string) => void;
  onRefresh?: () => void;

  // 테이블 설정
  dataType: 'user' | 'approval';
  showActions?: boolean;
  showCheckbox?: boolean;
}

// 결재 상태별 Chip 스타일 - approvalStatus 값에 맞춤
const getApprovalChipProps = (status: string) => {
  const statusMap = {
    'pending': { label: '대기중', color: 'warning' as const },
    'approved': { label: '승인', color: 'success' as const },
    'rejected': { label: '반려', color: 'error' as const },
  };
  
  const lowerStatus = status?.toLowerCase();
  return statusMap[lowerStatus as keyof typeof statusMap] || { label: '알 수 없음', color: 'default' as const };
};

// 결재 타입별 라벨
const getApprovalTypeLabel = (type: string) => {
  const typeMap = {
    'vacation': '휴가',
    'business_trip': '출장',
    'expense': '지출',
    'overtime': '초과근무',
    'purchase': '구매',
    'other': '기타'
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

// 날짜 포맷팅 함수
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '-';
  }
};

// 빈 데이터 오버레이 컴포넌트
const NoRowsOverlay = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%',
      gap: 1
    }}
  >
    <Typography variant="h6" color="text.secondary">
      표시할 결재가 없습니다
    </Typography>
    <Typography variant="body2" color="text.secondary">
      새로운 결재를 생성하거나 필터를 조정해보세요
    </Typography>
  </Box>
);

// 결재 테이블 컬럼 정의
function makeApprovalColumns(
  onDetail: (id: number) => void,
  onApprovalAction?: (id: number, action: 'approve' | 'reject') => void,
  showActions = true
): GridColDef<ApprovalDto>[] {
  const base: GridColDef<ApprovalDto>[] = [
    { 
      field: 'approvalName', 
      headerName: '결재명', 
      flex: 1, 
      minWidth: 150,
      renderCell: ({ value }) => (
        <Tooltip title={value || ''}>
          <span>{value || '-'}</span>
        </Tooltip>
      )
    },
    { 
      field: 'requesterName', 
      headerName: '요청자', 
      flex: 0.8, 
      minWidth: 100 
    },
    { 
      field: 'approverName', 
      headerName: '승인자', 
      flex: 0.8, 
      minWidth: 100 
    },
    {
      field: 'approvalType',
      headerName: '결재유형',
      flex: 0.8,
      minWidth: 100,
      renderCell: ({ value }) => getApprovalTypeLabel(value || '')
    },
    {
      field: 'createdAt',
      headerName: '요청일',
      flex: 0.8,
      minWidth: 110,
      renderCell: ({ value }) => formatDate(value)
    },
    {
      field: 'approvalStatus',
      headerName: '결재상태',
      width: 100,
      renderCell: ({ value }: GridRenderCellParams<ApprovalDto, string>) => {
        const chipProps = getApprovalChipProps(value || '');
        return (
          <Chip
            label={chipProps.label}
            color={chipProps.color}
            size="small"
            variant="outlined"
          />
        );
      },
    },
  ];

  if (showActions) {
    base.push({
      field: 'actions',
      headerName: '작업',
      width: 200,
      sortable: false,
      filterable: false,
      disableExport: true,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Button 
            size="small" 
            variant="outlined"
            onClick={() => onDetail(row.id)}
          >
            상세
          </Button>
          {row.approvalStatus === 'pending' && onApprovalAction && (
            <>
              <IconButton
                size="small"
                color="success"
                onClick={() => onApprovalAction(row.id, 'approve')}
                title="승인"
              >
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => onApprovalAction(row.id, 'reject')}
                title="반려"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Stack>
      ),
    });
  }

  return base;
}

export default function ApprovalTable({
  rows,
  totalCount,
  page,
  pageSize,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  selectedIds,
  onSelectionChange,
  onDetail,
  onPageChange,
  onSortChange,
  onFilterChange,
  onApprovalAction,
  onRefresh,
  dataType,
  showActions = true,
  showCheckbox = true,
  loading = false
}: ApprovalTableProps) {
  
  // 결재 테이블 컬럼 사용
  const columns = makeApprovalColumns(onDetail, onApprovalAction, showActions);

  // 페이지네이션 모델 변경 핸들러
  const handlePaginationChange = (model: GridPaginationModel) => {
    if (model.page + 1 !== page) {
      onPageChange(model.page + 1); // DataGrid는 0부터 시작, 우리 API는 1부터 시작
    }
    // pageSize 변경도 처리할 수 있음
    if (model.pageSize !== pageSize) {
      onFilterChange({ pageSize: model.pageSize });
    }
  };

  // 정렬 모델 변경 핸들러
  const handleSortChange = (model: GridSortModel) => {
    if (model.length > 0) {
      const sort = model[0];
      onSortChange(sort.field, sort.sort as 'asc' | 'desc');
    } else {
      onSortChange('createdAt', 'desc'); // 기본 정렬
    }
  };

  // 선택 모델 변경 핸들러
  const handleSelectionChange = (selectionModel: GridRowSelectionModel) => {
    onSelectionChange(selectionModel as unknown as GridRowId[]);
  };

  return (
    <Box>
      {/* 헤더 영역 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          총 {totalCount}건의 결재
        </Typography>
        {onRefresh && (
          <IconButton 
            onClick={onRefresh} 
            disabled={loading}
            size="small"
            title="새로고침"
          >
            <RefreshIcon />
          </IconButton>
        )}
      </Stack>

      {/* 데이터 그리드 */}
      <DataGrid
        rows={rows || []}
        columns={columns}
        checkboxSelection={showCheckbox}
        disableRowSelectionOnClick
        loading={loading}
        
        // 페이지네이션 설정
        pagination
        paginationMode="server"
        rowCount={totalCount || 0}
        paginationModel={{
          page: Math.max(0, (page || 1) - 1), // DataGrid는 0부터 시작, 음수 방지
          pageSize: pageSize || 10  // 기본값 제공
        }}
        onPaginationModelChange={handlePaginationChange}
        pageSizeOptions={[10, 25, 50, 100]}
        
        // 정렬 설정
        sortingMode="server"
        onSortModelChange={handleSortChange}
        
        // 선택 설정
        rowSelectionModel={selectedIds || []}
        onRowSelectionModelChange={handleSelectionChange}
        
        // 툴바 설정 - GridToolbar 사용
        slots={{
          toolbar: GridToolbar,
          noRowsOverlay: NoRowsOverlay,
        }}
        
        // 스타일 설정
        sx={{
          border: 0,
          minHeight: 400,
          '.MuiDataGrid-columnHeaders': { 
            backgroundColor: '#f9fafb',
            borderBottom: '2px solid #e5e7eb'
          },
          '.MuiDataGrid-row:hover': { 
            backgroundColor: '#f3f4f6' 
          },
          '.MuiDataGrid-cell': {
            borderBottom: '1px solid #f3f4f6'
          },
          // 로딩 상태 스타일
          '&.MuiDataGrid-root--loading .MuiDataGrid-overlay': {
            backgroundColor: 'rgba(255, 255, 255, 0.8)'
          }
        }}
      />

      {/* 하단 정보 */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mt: 2, px: 0.5 }}
      >
        <Typography variant="body2" color="text.secondary">
          {selectedIds && selectedIds.length > 0 && `${selectedIds.length}개 항목 선택됨`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          페이지 {page || 1} / {Math.max(1, totalPages || 1)}
        </Typography>
      </Stack>
    </Box>
  );
}